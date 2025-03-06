
package com.parquetviewer.service;

import com.parquetviewer.model.*;
import com.parquetviewer.config.S3ClientConfig;
import org.apache.hadoop.conf.Configuration;
import org.apache.hadoop.fs.Path;
import org.apache.parquet.column.page.PageReadStore;
import org.apache.parquet.example.data.simple.SimpleGroup;
import org.apache.parquet.example.data.simple.convert.GroupRecordConverter;
import org.apache.parquet.hadoop.ParquetFileReader;
import org.apache.parquet.hadoop.util.HadoopInputFile;
import org.apache.parquet.io.ColumnIOFactory;
import org.apache.parquet.io.MessageColumnIO;
import org.apache.parquet.io.RecordReader;
import org.apache.parquet.schema.MessageType;
import org.apache.parquet.schema.Type;
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

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
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
                    
                    // We'd need to read the actual Parquet file to get these details
                    // For now, we'll set placeholder values
                    file.setColumnCount(35); // Placeholder
                    file.setRowCount(10000); // Placeholder
                    
                    parquetFiles.add(file);
                }
            }
            
            return parquetFiles;
        } catch (Exception e) {
            throw new RuntimeException("Failed to list Parquet files from S3", e);
        }
    }

    @Override
    public ParquetMetadata getParquetMetadata(String fileId) {
        try {
            // In a real implementation, you'd find the file path from the fileId
            // For now, we'll assume the first file from the listing
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
            
            // Read Parquet metadata
            Configuration conf = new Configuration();
            Path path = new Path(tempFile.getAbsolutePath());
            ParquetMetadata metadata = new ParquetMetadata();
            
            try (ParquetFileReader reader = ParquetFileReader.open(HadoopInputFile.fromPath(path, conf))) {
                org.apache.parquet.hadoop.metadata.ParquetMetadata parquetMetadata = reader.getFooter();
                MessageType schema = parquetMetadata.getFileMetaData().getSchema();
                
                metadata.setId(fileId);
                metadata.setName(file.getName());
                metadata.setPath(file.getPath());
                metadata.setSize(file.getSize());
                metadata.setLastModified(file.getLastModified());
                metadata.setCreatedAt(file.getLastModified()); // Using last modified as a placeholder
                metadata.setFormat("PARQUET");
                metadata.setCompression(parquetMetadata.getBlocks().get(0).getColumns().get(0).getCodec().name());
                
                // Parse schema
                List<ParquetColumn> columns = new ArrayList<>();
                for (Type type : schema.getFields()) {
                    ParquetColumn column = new ParquetColumn();
                    column.setName(type.getName());
                    column.setType(type.asPrimitiveType().getPrimitiveTypeName().name());
                    column.setNullable(!type.isRepetition(Type.Repetition.REQUIRED));
                    
                    // Mock statistics for now
                    ParquetColumn.ColumnStatistics stats = new ParquetColumn.ColumnStatistics();
                    stats.setNullCount(0);
                    stats.setDistinctCount(1000);
                    column.setStatistics(stats);
                    
                    columns.add(column);
                }
                metadata.setSchema(columns);
                
                // Get row count
                long rowCount = parquetMetadata.getBlocks().stream()
                        .mapToLong(block -> block.getRowCount())
                        .sum();
                metadata.setRowCount((int) rowCount);
                
                // Statistics
                ParquetStatistics stats = new ParquetStatistics();
                stats.setTotalSize(file.getSize());
                stats.setRowGroups(parquetMetadata.getBlocks().size());
                stats.setAverageRowGroupSize(file.getSize() / (double) parquetMetadata.getBlocks().size());
                metadata.setStatistics(stats);
            }
            
            // Clean up the temporary file
            tempFile.delete();
            
            return metadata;
        } catch (Exception e) {
            throw new RuntimeException("Failed to read Parquet metadata", e);
        }
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
            
            // Read Parquet file
            Configuration conf = new Configuration();
            Path path = new Path(tempFile.getAbsolutePath());
            
            ParquetData data = new ParquetData();
            
            try (ParquetFileReader reader = ParquetFileReader.open(HadoopInputFile.fromPath(path, conf))) {
                MessageType schema = reader.getFooter().getFileMetaData().getSchema();
                
                // Get columns
                List<ParquetColumn> columns = new ArrayList<>();
                for (Type type : schema.getFields()) {
                    ParquetColumn column = new ParquetColumn();
                    column.setName(type.getName());
                    column.setType(type.asPrimitiveType().getPrimitiveTypeName().name());
                    column.setNullable(!type.isRepetition(Type.Repetition.REQUIRED));
                    
                    // Mock statistics for now
                    ParquetColumn.ColumnStatistics stats = new ParquetColumn.ColumnStatistics();
                    stats.setNullCount(0);
                    stats.setDistinctCount(1000);
                    column.setStatistics(stats);
                    
                    columns.add(column);
                }
                data.setColumns(columns);
                
                // Get total rows
                long totalRows = reader.getRecordCount();
                data.setTotalRows((int) totalRows);
                data.setCurrentPage(page);
                data.setPageSize(pageSize);
                
                // Skip to the requested page
                long rowsToSkip = (long) page * pageSize;
                long rowsRead = 0;
                
                List<Map<String, Object>> rows = new ArrayList<>();
                PageReadStore pages;
                
                while (rowsRead < rowsToSkip && (pages = reader.readNextRowGroup()) != null) {
                    long rowsInThisGroup = pages.getRowCount();
                    if (rowsRead + rowsInThisGroup <= rowsToSkip) {
                        // Skip this entire row group
                        rowsRead += rowsInThisGroup;
                    } else {
                        // Need to read this row group partially
                        MessageColumnIO columnIO = new ColumnIOFactory().getColumnIO(schema);
                        RecordReader<SimpleGroup> recordReader = columnIO.getRecordReader(
                                pages, new GroupRecordConverter(schema));
                        
                        // Skip rows within this group
                        long rowsToSkipInThisGroup = rowsToSkip - rowsRead;
                        for (int i = 0; i < rowsToSkipInThisGroup; i++) {
                            recordReader.read();
                        }
                        
                        rowsRead = rowsToSkip;
                        
                        // Read the rows we need
                        for (int i = 0; i < pageSize && rowsRead < totalRows; i++, rowsRead++) {
                            SimpleGroup group = recordReader.read();
                            Map<String, Object> row = new HashMap<>();
                            
                            for (int j = 0; j < schema.getFieldCount(); j++) {
                                Type field = schema.getType(j);
                                String name = field.getName();
                                
                                if (group.getFieldRepetitionCount(j) > 0) {
                                    Object value = convertParquetValue(group, field, j);
                                    row.put(name, value);
                                } else {
                                    row.put(name, null);
                                }
                            }
                            
                            rows.add(row);
                        }
                        
                        break;
                    }
                }
                
                // Continue reading if we haven't reached our page size
                while (rows.size() < pageSize && (pages = reader.readNextRowGroup()) != null) {
                    MessageColumnIO columnIO = new ColumnIOFactory().getColumnIO(schema);
                    RecordReader<SimpleGroup> recordReader = columnIO.getRecordReader(
                            pages, new GroupRecordConverter(schema));
                    
                    for (int i = 0; i < pages.getRowCount() && rows.size() < pageSize; i++) {
                        SimpleGroup group = recordReader.read();
                        Map<String, Object> row = new HashMap<>();
                        
                        for (int j = 0; j < schema.getFieldCount(); j++) {
                            Type field = schema.getType(j);
                            String name = field.getName();
                            
                            if (group.getFieldRepetitionCount(j) > 0) {
                                Object value = convertParquetValue(group, field, j);
                                row.put(name, value);
                            } else {
                                row.put(name, null);
                            }
                        }
                        
                        rows.add(row);
                    }
                }
                
                data.setRows(rows);
            }
            
            // Clean up the temporary file
            tempFile.delete();
            
            return data;
        } catch (Exception e) {
            throw new RuntimeException("Failed to read Parquet data", e);
        }
    }
    
    private File downloadParquetFile(String s3Key) throws IOException {
        File tempFile = Files.createTempFile("parquet-", ".tmp").toFile();
        
        GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                .bucket(s3ClientConfig.getBucketName())
                .key(s3Key)
                .build();
        
        s3Client.getObject(getObjectRequest, ResponseTransformer.toFile(tempFile));
        
        return tempFile;
    }
    
    private Object convertParquetValue(SimpleGroup group, Type field, int index) {
        try {
            switch (field.asPrimitiveType().getPrimitiveTypeName()) {
                case BOOLEAN:
                    return group.getBoolean(index, 0);
                case INT32:
                    return group.getInteger(index, 0);
                case INT64:
                    return group.getLong(index, 0);
                case FLOAT:
                    return group.getFloat(index, 0);
                case DOUBLE:
                    return group.getDouble(index, 0);
                case BINARY:
                    return group.getBinary(index, 0).toStringUsingUTF8();
                default:
                    return group.getValueToString(index, 0);
            }
        } catch (Exception e) {
            return null;
        }
    }
}
