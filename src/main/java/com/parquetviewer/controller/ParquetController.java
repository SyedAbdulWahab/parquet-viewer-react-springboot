package com.parquetviewer.controller;

import com.parquetviewer.model.ParquetFile;
import com.parquetviewer.model.ParquetMetadata;
import com.parquetviewer.model.ParquetData;
import com.parquetviewer.service.ParquetService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletResponse;
import java.util.List;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*") // For development; restrict in production
public class ParquetController {

    private final ParquetService parquetService;

    @Autowired
    public ParquetController(ParquetService parquetService) {
        this.parquetService = parquetService;
    }

    @GetMapping("/files")
    public ResponseEntity<List<ParquetFile>> getAllParquetFiles() {
        return ResponseEntity.ok(parquetService.getAllParquetFiles());
    }

    @GetMapping("/files/{id}/metadata")
    public ResponseEntity<ParquetMetadata> getParquetMetadata(@PathVariable String id) {
        return ResponseEntity.ok(parquetService.getParquetMetadata(id));
    }

    @GetMapping("/files/{id}/data")
    public ResponseEntity<ParquetData> getParquetData(
            @PathVariable String id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int pageSize) {
        return ResponseEntity.ok(parquetService.getParquetData(id, page, pageSize));
    }
    
    @GetMapping("/files/{id}/download")
    public void downloadParquetFile(
            @PathVariable String id,
            @RequestParam(defaultValue = "csv") String format,
            HttpServletResponse response) {
        parquetService.downloadParquetFile(id, format, response);
    }
}