package com.chaingraph.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record TransactionDto(
    @JsonProperty("txHash") String txHash,
    @JsonProperty("timestamp") String timestamp,
    @JsonProperty("fromWallet") String fromWallet,
    @JsonProperty("toWallet") String toWallet,
    @JsonProperty("amount") Double amount,
    @JsonProperty("tokenSymbol") String tokenSymbol,
    @JsonProperty("gasFee") Double gasFee,
    @JsonProperty("walletAgeDays") Integer walletAgeDays
) {}
