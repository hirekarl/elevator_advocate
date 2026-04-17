import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { Building, AdvocacyScript, ExecutiveSummary, OptimisticReport } from '../types';
import { API_BASE } from '../utils/api';

interface UseBuildingAdvocacyProps {
  buildingData: Building;
  onReportOptimistic?: (report: OptimisticReport) => void;
  refreshBuilding?: () => void;
  onShowAuth?: () => void;
}

export function useBuildingAdvocacy({
  buildingData,
  onReportOptimistic,
  refreshBuilding,
  onShowAuth
}: UseBuildingAdvocacyProps) {
  const { t, i18n } = useTranslation();
  const [advocacyScript, setAdvocacyScript] = useState<AdvocacyScript | null>(null);
  const [executiveSummary, setExecutiveSummary] = useState<ExecutiveSummary | null>(null);
  const [isLoadingScript, setIsLoadingScript] = useState(false);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [isReporting, setIsReporting] = useState(false);
  const [isRefreshingNews, setIsRefreshingNews] = useState(false);

  // Toast state
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVariant, setToastVariant] = useState('primary');

  // Advocacy modal state
  const [showAdvocacyModal, setShowAdvocacyModal] = useState(false);
  const [advocacyFormData, setAdvocacyFormData] = useState({ sr_number: '', description: '' });
  const [isSubmittingLog, setIsSubmittingLog] = useState(false);

  const triggerToast = (msg: string, variant: string = 'primary') => {
    setToastMessage(msg);
    setToastVariant(variant);
    setShowToast(true);
  };

  const fetchAdvocacyScript = useCallback(async () => {
    setIsLoadingScript(true);
    try {
      const response = await fetch(`${API_BASE}/api/buildings/${buildingData.bin}/advocacy_script/?lang=${i18n.language}`);
      if (response.ok) {
        const data = await response.json();
        setAdvocacyScript(data);
      }
    } catch (error) {
      console.error("Error fetching advocacy script:", error);
    } finally {
      setIsLoadingScript(false);
    }
  }, [buildingData.bin, i18n.language]);

  const fetchExecutiveSummary = useCallback(async () => {
    setIsLoadingSummary(true);
    try {
      for (let attempt = 0; attempt < 3; attempt++) {
        if (attempt > 0) {
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
        const response = await fetch(`${API_BASE}/api/buildings/${buildingData.bin}/advocacy_summary/?lang=${i18n.language}`);
        if (response.ok) {
          const data = await response.json();
          setExecutiveSummary(data);
          return;
        }
        if (response.status === 503) {
          const data = await response.json().catch(() => ({}));
          if (!data.retry) break;
          // retry: true — wait and loop
        } else {
          break; // 4xx or unexpected — don't retry
        }
      }
    } catch (error) {
      console.error("Error fetching executive summary:", error);
    } finally {
      setIsLoadingSummary(false);
    }
  }, [buildingData.bin, i18n.language]);

  useEffect(() => {
    if (buildingData?.bin) {
      fetchAdvocacyScript();
      fetchExecutiveSummary();
    }
  }, [buildingData?.bin, fetchAdvocacyScript, fetchExecutiveSummary]);

  const handleReport = async (status: string) => {
    const token = localStorage.getItem('token');
    if (!token) {
      if (onShowAuth) onShowAuth();
      return;
    }

    setIsReporting(true);

    if (onReportOptimistic) {
      onReportOptimistic({
        id: Date.now(),
        status,
        time: new Date().toLocaleTimeString(),
        pending: true,
      });
    }

    try {
      const res = await fetch(`${API_BASE}/api/buildings/${buildingData.bin}/report_status/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        triggerToast(t('report_status_success'), 'success');
        if (refreshBuilding) refreshBuilding();
      } else {
        const errorData = await res.json();
        triggerToast(errorData.error || t('error_sending_report'), 'danger');
      }
    } catch {
      triggerToast(t('error_sending_report'), 'danger');
    } finally {
      setIsReporting(false);
    }
  };

  const handleLogAdvocacy = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingLog(true);
    const token = localStorage.getItem('token');

    try {
      const res = await fetch(`${API_BASE}/api/buildings/${buildingData.bin}/log_advocacy_action/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify(advocacyFormData)
      });
      if (res.ok) {
        triggerToast(t('complaint_logged'), 'success');
        setShowAdvocacyModal(false);
        setAdvocacyFormData({ sr_number: '', description: '' });
        if (refreshBuilding) refreshBuilding();
      } else {
        const data = await res.json();
        triggerToast(data.error || t('error_sending_report'), 'danger');
      }
    } catch {
      triggerToast(t('network_error'), 'danger');
    } finally {
      setIsSubmittingLog(false);
    }
  };

  const handleRefreshNews = async () => {
    const token = localStorage.getItem('token');
    if (!token) return triggerToast(t('login_required'), 'warning');
    setIsRefreshingNews(true);
    try {
      const res = await fetch(`${API_BASE}/api/buildings/${buildingData.bin}/refresh_news/`, {
        method: 'POST',
        headers: { 'Authorization': `Token ${token}` }
      });
      if (res.ok) {
        triggerToast(t('news_sync_started'), 'success');
      } else {
        triggerToast(t('error_syncing_news'), 'danger');
      }
    } catch {
      triggerToast(t('error_syncing_news'), 'danger');
    } finally {
      setIsRefreshingNews(false);
    }
  };

  const handleCopySummary = () => {
    const summary = `Elevator Advocacy Report: ${buildingData.address}\n` +
      `- 30-Day Service Loss: ${buildingData.loss_of_service_30d != null ? `${buildingData.loss_of_service_30d}%` : '—'}\n` +
      `- Current Status: ${buildingData.verified_status}\n` +
      `- Active Complaints: ${buildingData.advocacy_logs?.length || 0}`;
    navigator.clipboard.writeText(summary);
    triggerToast(t('summary_copied'), 'success');
  };

  const handleCopyScript = (script: string) => {
    navigator.clipboard.writeText(script);
    triggerToast(t('script_copied'), 'info');
  };

  return {
    advocacyScript,
    executiveSummary,
    isLoadingScript,
    isLoadingSummary,
    isReporting,
    isRefreshingNews,
    showToast,
    setShowToast,
    toastMessage,
    toastVariant,
    showAdvocacyModal,
    setShowAdvocacyModal,
    advocacyFormData,
    setAdvocacyFormData,
    isSubmittingLog,
    handleReport,
    handleLogAdvocacy,
    handleRefreshNews,
    handleCopySummary,
    handleCopyScript,
    fetchExecutiveSummary,
    triggerToast
  };
}
