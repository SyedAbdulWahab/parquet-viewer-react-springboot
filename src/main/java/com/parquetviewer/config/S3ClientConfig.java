
package com.parquetviewer.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import lombok.Data;

@Configuration
@ConfigurationProperties(prefix = "aws.s3")
@Data
public class S3ClientConfig {
    private String accessKey;
    private String secretKey;
    private String sessionToken;
    private String region;
    private String bucketName;
    private String prefix = "";  // Optional prefix to filter files in the bucket
}
