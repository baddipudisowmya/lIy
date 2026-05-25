package com.liy.model;

import java.util.Map;

public class McqSubmission {

    private Map<String, Map<Integer, Integer>> answers; // role -> {questionId -> selectedOption}
    private String resumeAnalysisJson;

    public McqSubmission() {}

    public Map<String, Map<Integer, Integer>> getAnswers() { return answers; }
    public void setAnswers(Map<String, Map<Integer, Integer>> answers) { this.answers = answers; }

    public String getResumeAnalysisJson() { return resumeAnalysisJson; }
    public void setResumeAnalysisJson(String resumeAnalysisJson) { this.resumeAnalysisJson = resumeAnalysisJson; }
}
