package com.chaingraph.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

public record AnalysisRequestDto(
    @JsonProperty("datasetId") String datasetId,
    @JsonProperty("transactions") List<TransactionDto> transactions
) {}
