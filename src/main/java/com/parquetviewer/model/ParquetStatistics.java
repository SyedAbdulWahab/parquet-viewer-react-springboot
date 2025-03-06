
package com.parquetviewer.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ParquetStatistics {
    private double totalSize;
    private int rowGroups;
    private double averageRowGroupSize;
}
