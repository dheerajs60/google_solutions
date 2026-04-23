import apiClient from './api';

class AuditService {
    async runAudit(file, targetColumn, sensitiveAttributes, positiveLabel) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('target_column', targetColumn);
        formData.append('sensitive_attributes', sensitiveAttributes.join(','));
        formData.append('positive_label', positiveLabel);
        
        const response = await apiClient.post('/audit/run', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    }
    
    async getAudit(auditId) {
        const response = await apiClient.get(`/audit/${auditId}`);
        return response.data;
    }
    
    async runMitigation(auditId, reweighingStrength, thresholdAdjust, applyPostProcessing) {
        const response = await apiClient.post('/audit/mitigate', {
            audit_id: auditId,
            reweighing_strength: reweighingStrength,
            threshold_adjust: thresholdAdjust,
            apply_postprocessing: applyPostProcessing
        });
        return response.data;
    }
    
    async getAnalysis(auditId) {
        const response = await apiClient.get(`/audit/${auditId}/analysis`);
        return response.data;
    }
    
    async getHistory() {
        const response = await apiClient.get('/audit/history');
        return response.data;
    }
}

export const auditService = new AuditService();
