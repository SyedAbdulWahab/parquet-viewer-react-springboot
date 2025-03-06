
package com.parquetviewer.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ParquetData {
    private List<ParquetColumn> columns;
    private List<Map<String, Object>> rows;
    private int totalRows;
    private int currentPage;
    private int pageSize;
}
