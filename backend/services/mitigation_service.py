import pandas as pd
from sklearn.metrics import accuracy_score
from fairlearn.postprocessing import ThresholdOptimizer
from fairlearn.metrics import demographic_parity_difference, equalized_odds_difference, demographic_parity_ratio
from backend.models.schemas import MitigationResponse, AuditMetric, ParetoPoint
from backend.services.store import get_audit

def _get_status(score):
    return "PASS" if score > 0.9 else "WARNING" if score > 0.8 else "FAIL"

def run_mitigation(audit_id: str, reweighing_strength: float, threshold_adjust: float, apply_post: bool) -> MitigationResponse:
    stored = get_audit(audit_id)
    if not stored:
        raise ValueError("Audit ID not found or expired.")
        
    model = stored["model"]
    X_train = stored["X_train"]
    y_train = stored["y_train"]
    X_test = stored["X_test"]
    y_test = stored["y_test"]
    sensitive_train = stored["sensitive_train"]
    sensitive_test = stored["sensitive_test"]
    sensitive_attrs = stored["sensitive_attrs"]
    
    # Calculate BEFORE metrics on test set
    preds_before = model.predict(X_test)
    acc_before = accuracy_score(y_test, preds_before)
    
    # We target the first sensitive attribute since ThresholdOptimizer accepts a 1D column
    primary_attr = sensitive_attrs[0]
    sa_train = sensitive_train[primary_attr]
    sa_test = sensitive_test[primary_attr]
    
    dp_diff_before = demographic_parity_difference(y_test, preds_before, sensitive_features=sa_test)
    eo_diff_before = equalized_odds_difference(y_test, preds_before, sensitive_features=sa_test)
    di_ratio_before = demographic_parity_ratio(y_test, preds_before, sensitive_features=sa_test)
    
    dp_score_before = max(0, 1 - dp_diff_before)
    eo_score_before = max(0, 1 - eo_diff_before)
    di_score_before = min(di_ratio_before, 1/di_ratio_before) if di_ratio_before != 0 else 0
    fairness_before = (dp_score_before + eo_score_before + di_score_before) / 3
    
    # MITIGATION WITH THRESHOLD OPTIMIZER
    constraints = "demographic_parity" if threshold_adjust < 0.5 else "equalized_odds"
    
    optimizer = ThresholdOptimizer(
        estimator=model,
        constraints=constraints,
        predict_method="predict_proba",
        prefit=True # The Random Forest is already trained
    )
    
    # Fit the optimizer on the test predictions
    optimizer.fit(X_train, y_train, sensitive_features=sa_train)
    
    # Get new threshold-adjusted predictions on test set
    preds_after = optimizer.predict(X_test, sensitive_features=sa_test)
    acc_after = accuracy_score(y_test, preds_after)
    
    dp_diff_after = demographic_parity_difference(y_test, preds_after, sensitive_features=sa_test)
    eo_diff_after = equalized_odds_difference(y_test, preds_after, sensitive_features=sa_test)
    di_ratio_after = demographic_parity_ratio(y_test, preds_after, sensitive_features=sa_test)
    
    dp_score_after = max(0, 1 - dp_diff_after)
    eo_score_after = max(0, 1 - eo_diff_after)
    di_score_after = min(di_ratio_after, 1/di_ratio_after) if di_ratio_after != 0 else 0
    fairness_after = (dp_score_after + eo_score_after + di_score_after) / 3
    
    return MitigationResponse(
        before_metrics={
            "demographic_parity": AuditMetric(value=float(dp_score_before), status=_get_status(dp_score_before), description=f"DP ({primary_attr})"),
            "equal_opportunity": AuditMetric(value=float(eo_score_before), status=_get_status(eo_score_before), description=f"EO ({primary_attr})"),
            "disparate_impact": AuditMetric(value=float(di_score_before), status=_get_status(di_score_before), description=f"DI ({primary_attr})"),
        },
        after_metrics={
            "demographic_parity": AuditMetric(value=float(dp_score_after), status=_get_status(dp_score_after), description=f"DP ({primary_attr})"),
            "equal_opportunity": AuditMetric(value=float(eo_score_after), status=_get_status(eo_score_after), description=f"EO ({primary_attr})"),
            "disparate_impact": AuditMetric(value=float(di_score_after), status=_get_status(di_score_after), description=f"DI ({primary_attr})"),
        },
        pareto_points=[
            ParetoPoint(accuracy=float(acc_before), fairness=float(fairness_before), type="Current"),
            ParetoPoint(accuracy=float(acc_after), fairness=float(fairness_after), type="After Mitigation")
        ]
    )
