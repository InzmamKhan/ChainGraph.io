package com.chaingraph.service;

import com.chaingraph.dto.AnalysisRequestDto;
import com.chaingraph.dto.TransactionDto;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.UUID;

@Service
public class GraphAnalysisClientService {

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${python.engine.url:http://localhost:8000}")
    private String pythonEngineUrl;

    public String sendForComputation(List<TransactionDto> transactions) {
        String endpoint = pythonEngineUrl + "/api/v1/analyze";

        AnalysisRequestDto request = new AnalysisRequestDto(
            "dataset-" + UUID.randomUUID(),
            transactions
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<AnalysisRequestDto> entity = new HttpEntity<>(request, headers);

        ResponseEntity<String> response = restTemplate.postForEntity(endpoint, entity, String.class);
        return response.getBody();
    }
}
