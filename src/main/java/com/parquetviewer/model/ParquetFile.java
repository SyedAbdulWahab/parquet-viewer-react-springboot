
package com.parquetviewer.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ParquetFile {
    private String id;
    private String name;
    private String path;
    private long size;
    private String lastModified;
    private int columnCount;
    private int rowCount;
}
