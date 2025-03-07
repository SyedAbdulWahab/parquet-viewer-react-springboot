package com.parquetviewer.service;

import com.parquetviewer.model.ParquetFile;
import com.parquetviewer.model.ParquetMetadata;
import com.parquetviewer.model.ParquetData;

import java.util.List;
import javax.servlet.http.HttpServletResponse;

public interface ParquetService {
    List<ParquetFile> getAllParquetFiles();
    ParquetMetadata getParquetMetadata(String fileId);
    ParquetData getParquetData(String fileId, int page, int pageSize);
    void downloadParquetFile(String fileId, String format, HttpServletResponse response);
}