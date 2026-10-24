package com.chaingraph.controller;

import com.chaingraph.dto.TransactionDto;
import com.chaingraph.service.ExcelParserService;
import com.chaingraph.service.GraphAnalysisClientService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/transactions")
@CrossOrigin(origins = "*")
public class TransactionController {

    private final ExcelParserService excelParserService;
    private final GraphAnalysisClientService graphAnalysisClientService;

    public TransactionController(ExcelParserService excelParserService,
                                 GraphAnalysisClientService graphAnalysisClientService) {
        this.excelParserService = excelParserService;
        this.graphAnalysisClientService = graphAnalysisClientService;
    }

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> uploadAndAnalyze(@RequestParam("file") MultipartFile file) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body("{\"error\": \"Empty file uploaded\"}");
            }

            // 1. Parse Excel / CSV using Apache POI
            List<TransactionDto> transactions = excelParserService.parseFile(file);

            // 2. Transmit to Python ML & Graph Computation Engine
            String analysisResultJson = graphAnalysisClientService.sendForComputation(transactions);

            // 3. Return JSON back to React Frontend
            return ResponseEntity.ok(analysisResultJson);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("{\"error\": \"" + e.getMessage() + "\"}");
        }
    }
}
