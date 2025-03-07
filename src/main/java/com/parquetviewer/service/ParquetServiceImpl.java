package com.parquetviewer.service;

import com.parquetviewer.model.*;
import com.parquetviewer.config.S3ClientConfig;
import lombok.extern.slf4j.Slf4j;

import org.apache.avro.Schema;
import org.apache.avro.generic.GenericData;
import org.apache.avro.generic.GenericRecord;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVPrinter;
import org.apache.parquet.avro.AvroParquetReader;
import org.apache.parquet.avro.AvroParquetWriter;
import org.apache.parquet.column.ParquetProperties;
import org.apache.parquet.hadoop.ParquetReader;
import org.apache.hadoop.fs.Path;
import org.apache.parquet.io.InputFile;
import org.apache.parquet.io.OutputFile;
import org.apache.parquet.io.PositionOutputStream;
import org.apache.parquet.io.SeekableInputStream;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.auth.credentials.AwsSessionCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.sync.ResponseTransformer;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.ListObjectsV2Request;
import software.amazon.awssdk.services.s3.model.ListObjectsV2Response;
import software.amazon.awssdk.services.s3.model.S3Object;

import javax.servlet.http.HttpServletResponse;
import java.io.*;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
public class ParquetServiceImpl implements ParquetService {

    private final S3ClientConfig s3ClientConfig;
    private final S3Client s3Client;

    @Autowired
    public ParquetServiceImpl(S3ClientConfig s3ClientConfig) {
        this.s3ClientConfig = s3ClientConfig;
        this.s3Client = S3Client.builder()
                .region(Region.of(s3ClientConfig.getRegion()))
                .credentialsProvider(StaticCredentialsProvider.create(
                        AwsSessionCredentials.create(
                                s3ClientConfig.getAccessKey(),
                                s3ClientConfig.getSecretKey(),
                                s3ClientConfig.getSessionToken())))
                .build();
    }

    @Override
    public List<ParquetFile> getAllParquetFiles() {
        try {
            ListObjectsV2Request listRequest = ListObjectsV2Request.builder()
                    .bucket(s3ClientConfig.getBucketName())
                    .prefix(s3ClientConfig.getPrefix())
                    .build();

            ListObjectsV2Response response = s3Client.listObjectsV2(listRequest);
            
            List<ParquetFile> parquetFiles = new ArrayList<>();
            int idCounter = 1;
            
            for (S3Object s3Object : response.contents()) {
                if (s3Object.key().endsWith(".parquet")) {
                    ParquetFile file = new ParquetFile();
                    file.setId(String.valueOf(idCounter++));
                    file.setName(s3Object.key().substring(s3Object.key().lastIndexOf('/') + 1));
                    file.setPath("s3://" + s3ClientConfig.getBucketName() + "/" + s3Object.key());
                    file.setSize(s3Object.size());
                    file.setLastModified(s3Object.lastModified().toString());
                    
                    // We'll get better metadata in the detailed view
                    file.setColumnCount(0); 
                    file.setRowCount(0);
                    
                    parquetFiles.add(file);
                }
            }
            
            return parquetFiles;
        } catch (Exception e) {
            log.error("Failed to list Parquet files from S3", e);
            throw new RuntimeException("Failed to list Parquet files from S3", e);
        }
    }

    @Override
    public ParquetMetadata getParquetMetadata(String fileId) {
        try {
            // Find the file path from the fileId
            List<ParquetFile> files = getAllParquetFiles();
            if (files.isEmpty()) {
                throw new RuntimeException("No Parquet files found");
            }
            
            ParquetFile file = files.stream()
                    .filter(f -> f.getId().equals(fileId))
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException("File not found with ID: " + fileId));
            
            // Download the Parquet file to a temporary location
            String s3Key = file.getPath().replace("s3://" + s3ClientConfig.getBucketName() + "/", "");
            File tempFile = downloadParquetFile(s3Key);
            
            // Read Parquet metadata using Avro
            ParquetMetadata metadata = new ParquetMetadata();
            
            try (ParquetReader<GenericRecord> reader = AvroParquetReader
                    .<GenericRecord>builder(new LocalInputFile(tempFile))
                    .build()) {
                
                GenericRecord record = reader.read();
                if (record != null) {
                    Schema schema = record.getSchema();
                    
                    metadata.setId(fileId);
                    metadata.setName(file.getName());
                    metadata.setPath(file.getPath());
                    metadata.setSize(file.getSize());
                    metadata.setLastModified(file.getLastModified());
                    metadata.setCreatedAt(file.getLastModified()); // Using last modified as a placeholder
                    metadata.setFormat("PARQUET");
                    metadata.setCompression("SNAPPY"); // Default compression
                    
                    // Parse schema
                    List<ParquetColumn> columns = new ArrayList<>();
                    for (Schema.Field field : schema.getFields()) {
                        ParquetColumn column = new ParquetColumn();
                        column.setName(field.name());
                        column.setType(mapAvroTypeToParquetType(field.schema()));
                        column.setNullable(isNullable(field.schema()));
                        
                        // Set statistics
                        ParquetColumn.ColumnStatistics stats = new ParquetColumn.ColumnStatistics();
                        stats.setNullCount(0); // Would need column-level stats to get actual values
                        stats.setDistinctCount(0);
                        column.setStatistics(stats);
                        
                        columns.add(column);
                    }
                    metadata.setSchema(columns);
                    
                    // Count rows
                    long rowCount = countRows(tempFile);
                    metadata.setRowCount((int) rowCount);
                    
                    ParquetStatistics stats = new ParquetStatistics();
                    stats.setTotalSize(file.getSize());
                    stats.setRowGroups(1); // Default
                    stats.setAverageRowGroupSize(file.getSize());
                    metadata.setStatistics(stats);
                }
            }
            
            // Clean up the temporary file
            tempFile.delete();
            
            return metadata;
        } catch (Exception e) {
            log.error("Failed to read Parquet metadata", e);
            throw new RuntimeException("Failed to read Parquet metadata", e);
        }
    }

    private String mapAvroTypeToParquetType(Schema schema) {
        switch (schema.getType()) {
            case STRING:
                return "BINARY";
            case INT:
                return "INT32";
            case LONG:
                return "INT64";
            case FLOAT:
                return "FLOAT";
            case DOUBLE:
                return "DOUBLE";
            case BOOLEAN:
                return "BOOLEAN";
            case BYTES:
                return "BINARY";
            default:
                return schema.getType().toString();
        }
    }
    
    private boolean isNullable(Schema schema) {
        return schema.getType() == Schema.Type.UNION && 
               schema.getTypes().stream().anyMatch(s -> s.getType() == Schema.Type.NULL);
    }
    
    private long countRows(File parquetFile) throws IOException {
        long count = 0;
        try (ParquetReader<GenericRecord> reader = AvroParquetReader
                .<GenericRecord>builder(new LocalInputFile(parquetFile))
                .build()) {
            
            GenericRecord record;
            while ((record = reader.read()) != null) {
                count++;
            }
        }
        return count;
    }

    @Override
    public ParquetData getParquetData(String fileId, int page, int pageSize) {
        try {
            // Find the file by ID
            List<ParquetFile> files = getAllParquetFiles();
            ParquetFile file = files.stream()
                    .filter(f -> f.getId().equals(fileId))
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException("File not found with ID: " + fileId));
            
            // Download the Parquet file to a temporary location
            String s3Key = file.getPath().replace("s3://" + s3ClientConfig.getBucketName() + "/", "");
            File tempFile = downloadParquetFile(s3Key);
            
            // Read Parquet file using Avro
            ParquetData data = new ParquetData();
            
            // First get the schema
            Schema schema = null;
            try (ParquetReader<GenericRecord> reader = AvroParquetReader
                    .<GenericRecord>builder(new LocalInputFile(tempFile))
                    .build()) {
                
                GenericRecord record = reader.read();
                if (record != null) {
                    schema = record.getSchema();
                    
                    // Get columns
                    List<ParquetColumn> columns = new ArrayList<>();
                    for (Schema.Field field : schema.getFields()) {
                        ParquetColumn column = new ParquetColumn();
                        column.setName(field.name());
                        column.setType(mapAvroTypeToParquetType(field.schema()));
                        column.setNullable(isNullable(field.schema()));
                        
                        // Set statistics
                        ParquetColumn.ColumnStatistics stats = new ParquetColumn.ColumnStatistics();
                        stats.setNullCount(0);
                        stats.setDistinctCount(0);
                        column.setStatistics(stats);
                        
                        columns.add(column);
                    }
                    data.setColumns(columns);
                }
            }
            
            // Count total rows
            long totalRows = countRows(tempFile);
            data.setTotalRows((int) totalRows);
            data.setCurrentPage(page);
            data.setPageSize(pageSize);
            
            // Now read the actual data for the requested page
            List<Map<String, Object>> rows = new ArrayList<>();
            
            try (ParquetReader<GenericRecord> reader = AvroParquetReader
                    .<GenericRecord>builder(new LocalInputFile(tempFile))
                    .build()) {
                
                // Skip to the requested page
                long rowsToSkip = (long) page * pageSize;
                GenericRecord record;
                long rowsRead = 0;
                
                // Skip records to reach the right page
                while (rowsRead < rowsToSkip && (record = reader.read()) != null) {
                    rowsRead++;
                }
                
                // Read the requested page
                while (rows.size() < pageSize && (record = reader.read()) != null) {
                    Map<String, Object> row = new HashMap<>();
                    
                    for (Schema.Field field : schema.getFields()) {
                        String name = field.name();
                        Object value = record.get(name);
                        
                        // Convert Avro-specific types to simple Java types
                        if (value instanceof GenericData.Record) {
                            // For nested records, convert to string representation
                            row.put(name, value.toString());
                        } else if (value instanceof GenericData.Array) {
                            // For arrays, convert to List
                            List<Object> list = new ArrayList<>();
                            GenericData.Array<?> array = (GenericData.Array<?>) value;
                            for (Object item : array) {
                                list.add(convertAvroValueToJava(item));
                            }
                            row.put(name, list.toString());
                        } else if (value instanceof GenericData.Fixed) {
                            // For fixed types, convert to hex string
                            GenericData.Fixed fixed = (GenericData.Fixed) value;
                            byte[] bytes = fixed.bytes();
                            StringBuilder hexString = new StringBuilder();
                            for (byte b : bytes) {
                                hexString.append(String.format("%02x", b));
                            }
                            row.put(name, hexString.toString());
                        } else if (value instanceof GenericData.EnumSymbol) {
                            // For enum types, use toString
                            row.put(name, value.toString());
                        } else if (value instanceof ByteBuffer) {
                            // Handle ByteBuffer
                            ByteBuffer buffer = (ByteBuffer) value;
                            byte[] bytes = new byte[buffer.remaining()];
                            buffer.get(bytes);
                            row.put(name, new String(bytes, StandardCharsets.UTF_8).trim());
                        } else if (value instanceof byte[]) {
                            // Handle raw byte arrays
                            row.put(name, new String((byte[]) value, StandardCharsets.UTF_8).trim());
                        } else if (value instanceof CharSequence) {
                            // Convert all CharSequence implementations to Strings
                            row.put(name, value.toString());
                        } else {
                            row.put(name, value);
                        }
                    }
                    
                    rows.add(row);
                }
            }
            
            data.setRows(rows);
            
            // Clean up the temporary file
            tempFile.delete();
            
            return data;
        } catch (Exception e) {
            log.error("Failed to read Parquet data", e);
            throw new RuntimeException("Failed to read Parquet data", e);
        }
    }
    
    /**
     * Helper method to convert Avro values to Java values
     */
    private Object convertAvroValueToJava(Object value) {
        if (value == null) {
            return null;
        }
        
        if (value instanceof GenericData.Record) {
            return value.toString();
        } else if (value instanceof GenericData.Array) {
            List<Object> list = new ArrayList<>();
            GenericData.Array<?> array = (GenericData.Array<?>) value;
            for (Object item : array) {
                list.add(convertAvroValueToJava(item));
            }
            return list;
        } else if (value instanceof GenericData.Fixed) {
            GenericData.Fixed fixed = (GenericData.Fixed) value;
            byte[] bytes = fixed.bytes();
            StringBuilder hexString = new StringBuilder();
            for (byte b : bytes) {
                hexString.append(String.format("%02x", b));
            }
            return hexString.toString();
        } else if (value instanceof GenericData.EnumSymbol) {
            return value.toString();
        } else if (value instanceof ByteBuffer) {
            ByteBuffer buffer = (ByteBuffer) value;
            byte[] bytes = new byte[buffer.remaining()];
            buffer.get(bytes);
            return new String(bytes, StandardCharsets.UTF_8).trim();
        } else if (value instanceof byte[]) {
            return new String((byte[]) value, StandardCharsets.UTF_8).trim();
        } else if (value instanceof CharSequence) {
            return value.toString();
        }
        
        return value;
    }
    
    @Override
    public void downloadParquetFile(String fileId, String format, HttpServletResponse response) {
        try {
            // Find the file by ID
            List<ParquetFile> files = getAllParquetFiles();
            ParquetFile file = files.stream()
                    .filter(f -> f.getId().equals(fileId))
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException("File not found with ID: " + fileId));
            
            // Download the Parquet file to a temporary location
            String s3Key = file.getPath().replace("s3://" + s3ClientConfig.getBucketName() + "/", "");
            File tempFile = downloadParquetFile(s3Key);
            
            // Get the schema using Avro
            List<String> columnNames = new ArrayList<>();
            Schema schema = null;
            
            try (ParquetReader<GenericRecord> reader = AvroParquetReader
                    .<GenericRecord>builder(new LocalInputFile(tempFile))
                    .build()) {
                
                GenericRecord record = reader.read();
                if (record != null) {
                    schema = record.getSchema();
                    
                    // Get column names
                    for (Schema.Field field : schema.getFields()) {
                        columnNames.add(field.name());
                    }
                }
            }
            
            // Set response headers
            String fileName = file.getName().replace(".parquet", "");
            response.setCharacterEncoding(StandardCharsets.UTF_8.name());
            
            if (format.equalsIgnoreCase("csv")) {
                response.setContentType("text/csv");
                response.setHeader("Content-Disposition", "attachment; filename=\"" + fileName + ".csv\"");
                exportToCsv(tempFile, columnNames, response.getOutputStream());
            } else if (format.equalsIgnoreCase("excel")) {
                response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
                response.setHeader("Content-Disposition", "attachment; filename=\"" + fileName + ".xlsx\"");
                exportToExcel(tempFile, columnNames, response.getOutputStream());
            } else {
                response.sendError(400, "Invalid format. Supported formats: csv, excel");
            }
            
            // Clean up
            tempFile.delete();
            
        } catch (Exception e) {
            log.error("Failed to download Parquet file", e);
            try {
                response.sendError(500, "Failed to download file: " + e.getMessage());
            } catch (IOException ioException) {
                log.error("Failed to send error response", ioException);
            }
        }
    }
    
    private File downloadParquetFile(String s3Key) throws IOException {
        File tempFile = Files.createTempFile("parquet-", ".tmp").toFile();

        GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                .bucket(s3ClientConfig.getBucketName())
                .key(s3Key)
                .build();

        try (InputStream in = s3Client.getObject(getObjectRequest);
             OutputStream out = new BufferedOutputStream(new FileOutputStream(tempFile))) {

            byte[] buffer = new byte[1024];
            int lengthRead;
            while ((lengthRead = in.read(buffer)) > 0) {
                out.write(buffer, 0, lengthRead);
                out.flush();
            }
        }

        return tempFile;
    }
    
    private void exportToCsv(File parquetFile, List<String> columnNames, OutputStream outputStream) throws IOException {
        try (CSVPrinter csvPrinter = new CSVPrinter(
                new OutputStreamWriter(outputStream, StandardCharsets.UTF_8),
                CSVFormat.DEFAULT.builder().setHeader(columnNames.toArray(new String[0])).build())) {
            
            try (ParquetReader<GenericRecord> reader = AvroParquetReader
                    .<GenericRecord>builder(new LocalInputFile(parquetFile))
                    .build()) {
                
                GenericRecord record;
                while ((record = reader.read()) != null) {
                    List<Object> rowValues = new ArrayList<>();
                    for (String columnName : columnNames) {
                        Object value = record.get(columnName);
                        rowValues.add(convertAvroValueToJava(value));
                    }
                    csvPrinter.printRecord(rowValues);
                }
            }
        }
    }
    
    private void exportToExcel(File parquetFile, List<String> columnNames, OutputStream outputStream) throws IOException {
        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Data");
            
            // Create header row
            Row headerRow = sheet.createRow(0);
            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);
            
            for (int i = 0; i < columnNames.size(); i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(columnNames.get(i));
                cell.setCellStyle(headerStyle);
            }
            
            // Read Parquet data and add to Excel
            try (ParquetReader<GenericRecord> reader = AvroParquetReader
                    .<GenericRecord>builder(new LocalInputFile(parquetFile))
                    .build()) {
                
                GenericRecord record;
                int rowNum = 1;
                
                while ((record = reader.read()) != null) {
                    Row row = sheet.createRow(rowNum++);
                    
                    for (int i = 0; i < columnNames.size(); i++) {
                        Cell cell = row.createCell(i);
                        Object value = record.get(columnNames.get(i));
                        value = convertAvroValueToJava(value);
                        
                        if (value != null) {
                            if (value instanceof Number) {
                                cell.setCellValue(((Number) value).doubleValue());
                            } else if (value instanceof Boolean) {
                                cell.setCellValue((Boolean) value);
                            } else {
                                cell.setCellValue(value.toString());
                            }
                        }
                    }
                    
                    // To prevent memory issues, flush to disk periodically
                    if (rowNum % 1000 == 0) {
                        ((XSSFWorkbook) workbook).write(new ByteArrayOutputStream()); // Force flush
                    }
                }
            }
            
            // Auto size columns
            for (int i = 0; i < columnNames.size(); i++) {
                sheet.autoSizeColumn(i);
            }
            
            workbook.write(outputStream);
        }
    }
    
    // Custom InputFile implementation for Parquet to read from local files without Hadoop
    private static class LocalInputFile implements InputFile {
        private final File file;
        
        LocalInputFile(File file) {
            this.file = file;
        }
        
        @Override
        public long getLength() throws IOException {
            return file.length();
        }
        
        @Override
        public SeekableInputStream newStream() throws IOException {
            return new LocalSeekableInputStream(file);
        }
    }
    
    // Custom SeekableInputStream implementation
    private static class LocalSeekableInputStream extends SeekableInputStream {
        private final RandomAccessFile randomAccessFile;
        
        LocalSeekableInputStream(File file) throws IOException {
            this.randomAccessFile = new RandomAccessFile(file, "r");
        }
        
        @Override
        public long getPos() throws IOException {
            return randomAccessFile.getFilePointer();
        }
        
        @Override
        public void seek(long newPos) throws IOException {
            randomAccessFile.seek(newPos);
        }
        
        @Override
        public int read() throws IOException {
            return randomAccessFile.read();
        }
        
        @Override
        public int read(byte[] b) throws IOException {
            return randomAccessFile.read(b);
        }
        
        @Override
        public int read(byte[] b, int off, int len) throws IOException {
            return randomAccessFile.read(b, off, len);
        }
        
        @Override
        public void close() throws IOException {
            randomAccessFile.close();
        }
        
        @Override
        public void readFully(byte[] bytes) throws IOException {
            randomAccessFile.readFully(bytes);
        }
        
        @Override
        public void readFully(byte[] bytes, int start, int len) throws IOException {
            randomAccessFile.readFully(bytes, start, len);
        }
        
        @Override
        public int read(ByteBuffer byteBuffer) throws IOException {
            byte[] buffer = new byte[byteBuffer.remaining()];
            int bytesRead = randomAccessFile.read(buffer);
            if (bytesRead > 0) {
                byteBuffer.put(buffer, 0, bytesRead);
            }
            return bytesRead;
        }
        
        @Override
        public void readFully(ByteBuffer byteBuffer) throws IOException {
            byte[] buffer = new byte[byteBuffer.remaining()];
            randomAccessFile.readFully(buffer);
            byteBuffer.put(buffer);
        }
    }
}
