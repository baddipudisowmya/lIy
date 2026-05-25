package com.liy.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.liy.model.McqQuestion;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.io.InputStream;
import java.util.*;

@Service
public class McqService {

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final Map<String, List<McqQuestion>> questionBank = new HashMap<>();

    @PostConstruct
    public void loadQuestions() {
        String[] roles = {
            "sde", "fde", "test_dev", "data_scientist", "devops",
            "ml_engineer", "backend_dev", "mobile_dev", "cloud_architect", "cybersecurity"
        };

        for (String role : roles) {
            try {
                ClassPathResource resource = new ClassPathResource("mcqs/" + role + ".json");
                try (InputStream is = resource.getInputStream()) {
                    List<McqQuestion> questions = objectMapper.readValue(is,
                            new TypeReference<List<McqQuestion>>() {});
                    questionBank.put(role, questions);
                }
            } catch (IOException e) {
                System.err.println("Warning: Could not load MCQs for role: " + role + " - " + e.getMessage());
                questionBank.put(role, new ArrayList<>());
            }
        }
        System.out.println("✅ Loaded MCQ question banks for " + questionBank.size() + " roles");
    }

    public List<McqQuestion> getQuestionsForRole(String role) {
        String key = role.toLowerCase().replace(" ", "_").replace("/", "_");
        List<McqQuestion> questions = questionBank.get(key);
        if (questions == null || questions.isEmpty()) {
            return Collections.emptyList();
        }
        // Return questions without correct answers (for the frontend)
        return questions.stream().map(q -> {
            McqQuestion safeQ = new McqQuestion();
            safeQ.setId(q.getId());
            safeQ.setQuestion(q.getQuestion());
            safeQ.setOptions(q.getOptions());
            safeQ.setDifficulty(q.getDifficulty());
            // Don't send correctAnswer or explanation
            return safeQ;
        }).toList();
    }

    public Map<String, Object> scoreAnswers(Map<String, Map<Integer, Integer>> submissions) {
        Map<String, Object> results = new HashMap<>();
        Map<String, Integer> scores = new HashMap<>();
        Map<String, List<Map<String, Object>>> details = new HashMap<>();
        int totalCorrect = 0;
        int totalQuestions = 0;

        for (Map.Entry<String, Map<Integer, Integer>> entry : submissions.entrySet()) {
            String role = entry.getKey().toLowerCase().replace(" ", "_").replace("/", "_");
            Map<Integer, Integer> answers = entry.getValue();
            List<McqQuestion> questions = questionBank.get(role);

            if (questions == null) continue;

            int correct = 0;
            List<Map<String, Object>> roleDetails = new ArrayList<>();

            for (McqQuestion q : questions) {
                Integer userAnswer = answers.get(q.getId());
                boolean isCorrect = userAnswer != null && userAnswer == q.getCorrectAnswer();
                if (isCorrect) correct++;

                Map<String, Object> detail = new HashMap<>();
                detail.put("questionId", q.getId());
                detail.put("correct", isCorrect);
                detail.put("correctAnswer", q.getCorrectAnswer());
                detail.put("userAnswer", userAnswer);
                detail.put("explanation", q.getExplanation());
                roleDetails.add(detail);
            }

            scores.put(role, (int) Math.round((double) correct / questions.size() * 100));
            details.put(role, roleDetails);
            totalCorrect += correct;
            totalQuestions += questions.size();
        }

        results.put("scores", scores);
        results.put("details", details);
        results.put("overallScore", totalQuestions > 0
                ? (int) Math.round((double) totalCorrect / totalQuestions * 100) : 0);

        return results;
    }

    public List<String> getAvailableRoles() {
        return questionBank.keySet().stream().sorted().toList();
    }
}
