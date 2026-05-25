package com.liy.model;

import java.util.List;
import java.util.Map;

public class AnalyzeResponse {

    private ResumeAnalysis resumeAnalysis;
    private Verdict verdict;
    private String resumeAnalysisJson;

    public AnalyzeResponse() {}

    public ResumeAnalysis getResumeAnalysis() { return resumeAnalysis; }
    public void setResumeAnalysis(ResumeAnalysis resumeAnalysis) { this.resumeAnalysis = resumeAnalysis; }

    public Verdict getVerdict() { return verdict; }
    public void setVerdict(Verdict verdict) { this.verdict = verdict; }

    public String getResumeAnalysisJson() { return resumeAnalysisJson; }
    public void setResumeAnalysisJson(String resumeAnalysisJson) { this.resumeAnalysisJson = resumeAnalysisJson; }
}
