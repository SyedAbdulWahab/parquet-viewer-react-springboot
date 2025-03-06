
package com.parquetviewer.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ParquetMetadata {
    private String id;
    private String name;
    private String path;
    private double size;
    private String lastModified;
    private String createdAt;
    private String format;
    private String compression;
    private List<ParquetColumn> schema;
    private int rowCount;
    private ParquetStatistics statistics;
}
