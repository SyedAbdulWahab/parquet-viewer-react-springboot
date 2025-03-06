
package com.parquetviewer.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ParquetColumn {
    private String name;
    private String type;
    private boolean nullable;
    private ColumnStatistics statistics;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ColumnStatistics {
        private long nullCount;
        private long distinctCount;
    }
}
