package com.liy.model;

import java.util.List;
import java.util.Map;

public class Verdict {

    private Map<String, RoleVerdict> roleVerdicts;

    public Verdict() {}

    public Map<String, RoleVerdict> getRoleVerdicts() { return roleVerdicts; }
    public void setRoleVerdicts(Map<String, RoleVerdict> roleVerdicts) { this.roleVerdicts = roleVerdicts; }

    public static class RoleVerdict {
        private boolean pass;
        private int confidence;
        private List<String> keyGaps;
        private List<String> keyStrengths;
        private String summary;

        public RoleVerdict() {}

        public boolean isPass() { return pass; }
        public void setPass(boolean pass) { this.pass = pass; }

        public int getConfidence() { return confidence; }
        public void setConfidence(int confidence) { this.confidence = confidence; }

        public List<String> getKeyGaps() { return keyGaps; }
        public void setKeyGaps(List<String> keyGaps) { this.keyGaps = keyGaps; }

        public List<String> getKeyStrengths() { return keyStrengths; }
        public void setKeyStrengths(List<String> keyStrengths) { this.keyStrengths = keyStrengths; }

        public String getSummary() { return summary; }
        public void setSummary(String summary) { this.summary = summary; }
    }
}
