import React, { useState, useEffect } from 'react';
import {
  Save,
  CheckCircle2,
  Database,
  Shield,
  Activity,
  Play,
  Check,
  AlertCircle,
  Users,
  RefreshCw,
  Server,
  Zap,
  Phone,
  Mail,
  MessageSquare,
  Instagram,
  MapPin,
  Clock,
  ExternalLink,
  Edit3,
  Send,
  Eye,
  ShieldAlert,
  Bot,
  Truck,
  CheckCheck,
} from 'lucide-react';
import { formatTzs, formatDate } from '../../utils/format.ts';
import { MessageTemplate, ExternalMessageDispatch } from '../../types/bakery.ts';
import { isSupabaseConfigured } from '../../lib/supabase.ts';
import { authFetch, getStaffAuthHeaders } from '../../lib/auth-client.ts';

interface StaffUser {
  id: string | number;
  email: string;
  displayName?: string;
  fullName?: string;
  role: string;
  createdAt?: string;
}

interface TestResult {
  test: string;
  status: 'PASSED' | 'FAILED';
  details?: string;
}

export const SettingsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'contact' | 'templates' | 'dispatches' | 'general' | 'staff' | 'database' | 'tests'
  >('contact');

  // Contact & general settings
  const [settings, setSettings] = useState<Record<string, string>>({
    bakery_name: 'LK Bakehouse',
    phone_number: '+255 754 889 900',
    email_address: 'hello@lkbakehouse.co.tz',
    whatsapp_number: '+255754889900',
    instagram_handle: '@lkbakehouse_tz',
    physical_location: 'Plot 42, Haile Selassie Road, Masaki, Dar es Salaam',
    operating_hours: 'Mon – Sat: 7:00 AM – 8:00 PM | Sun: 8:00 AM – 5:00 PM',
    delivery_fee_base_tzs: '7000',
    currency_code: 'TZS',
  });

  const [contactLinks, setContactLinks] = useState<Record<string, string>>({});
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Message templates state
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null);
  const [editingTemplateKey, setEditingTemplateKey] = useState<string | null>(null);
  const [templateSubject, setTemplateSubject] = useState('');
  const [templateBody, setTemplateBody] = useState('');
  const [templateChannel, setTemplateChannel] = useState<'in_app' | 'whatsapp' | 'email' | 'sms'>('in_app');
  const [templateEnabled, setTemplateEnabled] = useState(true);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [templateSaveSuccess, setTemplateSaveSuccess] = useState(false);

  // Dispatches state
  const [dispatches, setDispatches] = useState<ExternalMessageDispatch[]>([]);
  const [loadingDispatches, setLoadingDispatches] = useState(false);
  const [testChannel, setTestChannel] = useState<'whatsapp' | 'email' | 'sms'>('whatsapp');
  const [testRecipient, setTestRecipient] = useState('+255754889900');
  const [testBody, setTestBody] = useState('Habari from LK Bakehouse test dispatch gateway.');
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [dispatchStatusResult, setDispatchStatusResult] = useState<any | null>(null);
  const [isDispatching, setIsDispatching] = useState(false);

  // Staff state
  const [staffList, setStaffList] = useState<StaffUser[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [updatingRoleId, setUpdatingRoleId] = useState<string | number | null>(null);

  // Test suite state
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[] | null>(null);
  const [overallTestStatus, setOverallTestStatus] = useState<string | null>(null);

  useEffect(() => {
    fetchSettingsAndChannels();
    fetchTemplates();
  }, []);

  const fetchSettingsAndChannels = async () => {
    setLoadingSettings(true);
    try {
      const res = await fetch('/api/settings/contact');
      const data = await res.json();
      if (data) {
        setSettings((prev) => ({
          ...prev,
          phone_number: data.phone || prev.phone_number,
          email_address: data.email || prev.email_address,
          whatsapp_number: data.whatsapp || prev.whatsapp_number,
          instagram_handle: data.instagram || prev.instagram_handle,
          physical_location: data.physicalLocation || prev.physical_location,
          operating_hours: data.operatingHours || prev.operating_hours,
          delivery_fee_base_tzs: String(data.deliveryFeeBaseTzs || prev.delivery_fee_base_tzs),
        }));
        setContactLinks(data.links || {});
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    } finally {
      setLoadingSettings(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/communication/templates');
      const data = await res.json();
      if (Array.isArray(data)) {
        setTemplates(data);
        if (!selectedTemplate && data.length > 0) {
          handleSelectTemplate(data[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching message templates:', err);
    }
  };

  const handleSelectTemplate = (t: MessageTemplate) => {
    setSelectedTemplate(t);
    setEditingTemplateKey(t.templateKey);
    setTemplateSubject(t.subject || '');
    setTemplateBody(t.bodyTemplate || '');
    setTemplateChannel(t.channel || 'in_app');
    setTemplateEnabled(t.isEnabled !== false);
  };

  const handleSaveContactSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setSaveSuccess(false);

    try {
      const res = await authFetch('/api/settings/contact', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        setSaveSuccess(true);
        fetchSettingsAndChannels();
        setTimeout(() => setSaveSuccess(false), 4000);
      }
    } catch (err) {
      console.error('Error saving settings:', err);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTemplateKey) return;
    setSavingTemplate(true);
    setTemplateSaveSuccess(false);

    try {
      const res = await authFetch(`/api/communication/templates/${editingTemplateKey}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: templateSubject.trim() || undefined,
          bodyTemplate: templateBody.trim(),
          channel: templateChannel,
          isEnabled: templateEnabled,
        }),
      });

      if (res.ok) {
        setTemplateSaveSuccess(true);
        fetchTemplates();
        setTimeout(() => setTemplateSaveSuccess(false), 4000);
      }
    } catch (err) {
      console.error('Error saving template:', err);
    } finally {
      setSavingTemplate(false);
    }
  };

  const fetchDispatches = async () => {
    setLoadingDispatches(true);
    try {
      const res = await fetch('/api/communication/dispatches');
      const data = await res.json();
      if (Array.isArray(data)) {
        setDispatches(data);
      }
    } catch (err) {
      console.error('Error fetching dispatches:', err);
    } finally {
      setLoadingDispatches(false);
    }
  };

  const handleTestDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsDispatching(true);
    setDispatchStatusResult(null);

    try {
      const res = await authFetch('/api/communication/dispatch-external', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: testChannel,
          recipient: testRecipient.trim(),
          messageBody: testBody.trim(),
          simulateFailure,
        }),
      });

      const data = await res.json();
      setDispatchStatusResult({
        ok: res.ok,
        status: res.status,
        data,
      });
      fetchDispatches();
    } catch (err: any) {
      setDispatchStatusResult({
        ok: false,
        status: 500,
        data: { error: err.message },
      });
    } finally {
      setIsDispatching(false);
    }
  };

  const fetchStaff = async () => {
    setLoadingStaff(true);
    try {
      const res = await fetch('/api/users', {
        headers: getStaffAuthHeaders(),
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setStaffList(data);
      }
    } catch (err) {
      console.error('Error fetching staff:', err);
    } finally {
      setLoadingStaff(false);
    }
  };

  const handleUpdateRole = async (userId: string | number, nextRole: string) => {
    setUpdatingRoleId(userId);
    try {
      const res = await authFetch(`/api/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: nextRole }),
      });
      if (res.ok) {
        setStaffList((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: nextRole } : u))
        );
      }
    } catch (err) {
      console.error('Error updating staff role:', err);
    } finally {
      setUpdatingRoleId(null);
    }
  };

  const handleRunTests = async () => {
    setIsRunningTests(true);
    setTestResults(null);
    setOverallTestStatus(null);
    try {
      const res = await authFetch('/api/admin/run-tests', { method: 'POST' });
      const data = await res.json();
      setTestResults(data.results || []);
      setOverallTestStatus(data.overall || 'COMPLETED');
    } catch (err) {
      console.error('Error running test runner:', err);
    } finally {
      setIsRunningTests(false);
    }
  };

  const variableTokens = [
    { token: '{{customer_name}}', desc: 'Customer full name' },
    { token: '{{order_number}}', desc: 'Official order number (e.g. LKB-2026-1234)' },
    { token: '{{item_count}}', desc: 'Total line items in order' },
    { token: '{{order_total}}', desc: 'Authoritative total amount in TSh' },
    { token: '{{fulfillment_type}}', desc: 'Doorstep Delivery or Masaki Pickup' },
    { token: '{{delivery_address}}', desc: 'Delivery street address' },
    { token: '{{delivery_fee}}', desc: 'Configured delivery fee in TSh' },
    { token: '{{expected_time}}', desc: 'Expected fulfillment time' },
    { token: '{{bakery_phone}}', desc: 'Store hotline telephone' },
    { token: '{{bakery_whatsapp}}', desc: 'Bakery WhatsApp link' },
    { token: '{{bakery_location}}', desc: 'Plot 42 Haile Selassie Road, Masaki' },
    { token: '{{ticket_number}}', desc: 'Support Ticket # when human handoff occurs' },
  ];

  return (
    <div className="space-y-6">
      {/* Header and Sub-Tabs Navigation */}
      <div className="bg-white p-5 rounded-xl border border-[#E8DFD8] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h3 className="font-display text-lg font-bold text-[#292524]">
            Bakery Profile, Channels & Communication Settings
          </h3>
          <p className="text-xs text-[#78716C] mt-0.5">
            Configure contact channels, editable automated response templates, external messaging dispatches, and staff accounts.
          </p>
        </div>

        <div className="flex flex-wrap bg-[#FAF7F2] p-1 rounded-lg border border-[#E8DFD8] text-xs">
          <button
            onClick={() => setActiveTab('contact')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              activeTab === 'contact' ? 'bg-[#C85A32] text-white shadow-xs' : 'text-[#78716C] hover:text-[#292524]'
            }`}
          >
            Contact Channels
          </button>

          <button
            onClick={() => setActiveTab('templates')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              activeTab === 'templates' ? 'bg-[#C85A32] text-white shadow-xs' : 'text-[#78716C] hover:text-[#292524]'
            }`}
          >
            Message Templates (12)
          </button>

          <button
            onClick={() => {
              setActiveTab('dispatches');
              fetchDispatches();
            }}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              activeTab === 'dispatches' ? 'bg-[#C85A32] text-white shadow-xs' : 'text-[#78716C] hover:text-[#292524]'
            }`}
          >
            External Dispatches Log
          </button>

          <button
            onClick={() => setActiveTab('general')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              activeTab === 'general' ? 'bg-[#C85A32] text-white shadow-xs' : 'text-[#78716C] hover:text-[#292524]'
            }`}
          >
            General Profile
          </button>

          <button
            onClick={() => {
              setActiveTab('staff');
              fetchStaff();
            }}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              activeTab === 'staff' ? 'bg-[#C85A32] text-white shadow-xs' : 'text-[#78716C] hover:text-[#292524]'
            }`}
          >
            Staff & Roles
          </button>

          <button
            onClick={() => setActiveTab('database')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              activeTab === 'database' ? 'bg-[#C85A32] text-white shadow-xs' : 'text-[#78716C] hover:text-[#292524]'
            }`}
          >
            Database & Real-Time
          </button>

          <button
            onClick={() => {
              setActiveTab('tests');
              if (!testResults) handleRunTests();
            }}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'tests' ? 'bg-[#C85A32] text-white shadow-xs' : 'text-[#78716C] hover:text-[#292524]'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Test Suite</span>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* TAB 1: CONTACT CHANNELS & CLICK-TO-CONTACT VERIFICATION */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'contact' && (
        <form onSubmit={handleSaveContactSettings} className="space-y-6">
          {saveSuccess && (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-semibold text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Contact channels saved to PostgreSQL database!</span>
            </div>
          )}

          <div className="bg-white p-6 rounded-xl border border-[#E8DFD8] shadow-xs space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-[#E8DFD8]">
              <div>
                <h4 className="font-display text-base font-bold text-[#292524]">
                  Official Customer Contact Channels
                </h4>
                <p className="text-xs text-[#78716C]">
                  These numbers and links appear across all customer order confirmations, receipts, and click-to-contact links.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
              {/* Phone Channel */}
              <div className="space-y-2 p-3 bg-[#FAF7F2] rounded-xl border border-[#E8DFD8]">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-[#292524] flex items-center gap-1.5">
                    <Phone className="w-4 h-4 text-[#C85A32]" />
                    <span>Telephone Hotline *</span>
                  </label>
                  {contactLinks.phoneClickUrl && (
                    <a
                      href={contactLinks.phoneClickUrl}
                      className="text-[11px] text-[#C85A32] hover:underline flex items-center gap-1 font-mono"
                      title="Test Click-to-Call"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Test Call</span>
                    </a>
                  )}
                </div>
                <input
                  type="text"
                  required
                  value={settings.phone_number || ''}
                  onChange={(e) => setSettings({ ...settings, phone_number: e.target.value })}
                  placeholder="+255 754 889 900"
                  className="w-full px-3 py-2 bg-white border border-[#E8DFD8] rounded-lg font-mono"
                />
                <span className="text-[10px] text-stone-400 block">Click link: {contactLinks.phoneClickUrl || 'tel:...'}</span>
              </div>

              {/* WhatsApp Channel */}
              <div className="space-y-2 p-3 bg-[#FAF7F2] rounded-xl border border-[#E8DFD8]">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-[#292524] flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-emerald-600" />
                    <span>WhatsApp Direct Messaging *</span>
                  </label>
                  {contactLinks.whatsappClickUrl && (
                    <a
                      href={contactLinks.whatsappClickUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-emerald-700 hover:underline flex items-center gap-1 font-mono"
                      title="Test WhatsApp Link"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Open WhatsApp</span>
                    </a>
                  )}
                </div>
                <input
                  type="text"
                  required
                  value={settings.whatsapp_number || ''}
                  onChange={(e) => setSettings({ ...settings, whatsapp_number: e.target.value })}
                  placeholder="+255754889900"
                  className="w-full px-3 py-2 bg-white border border-[#E8DFD8] rounded-lg font-mono"
                />
                <span className="text-[10px] text-stone-400 block">Direct URL: {contactLinks.whatsappClickUrl || 'https://wa.me/...'}</span>
              </div>

              {/* Email Channel */}
              <div className="space-y-2 p-3 bg-[#FAF7F2] rounded-xl border border-[#E8DFD8]">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-[#292524] flex items-center gap-1.5">
                    <Mail className="w-4 h-4 text-blue-600" />
                    <span>Customer Support Email *</span>
                  </label>
                  {contactLinks.emailClickUrl && (
                    <a
                      href={contactLinks.emailClickUrl}
                      className="text-[11px] text-blue-700 hover:underline flex items-center gap-1 font-mono"
                      title="Test Email Client"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Compose Email</span>
                    </a>
                  )}
                </div>
                <input
                  type="email"
                  required
                  value={settings.email_address || ''}
                  onChange={(e) => setSettings({ ...settings, email_address: e.target.value })}
                  placeholder="hello@lkbakehouse.co.tz"
                  className="w-full px-3 py-2 bg-white border border-[#E8DFD8] rounded-lg font-mono"
                />
                <span className="text-[10px] text-stone-400 block">Mailto: {contactLinks.emailClickUrl || 'mailto:...'}</span>
              </div>

              {/* Instagram Channel */}
              <div className="space-y-2 p-3 bg-[#FAF7F2] rounded-xl border border-[#E8DFD8]">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-[#292524] flex items-center gap-1.5">
                    <Instagram className="w-4 h-4 text-pink-600" />
                    <span>Instagram Profile Handle *</span>
                  </label>
                  {contactLinks.instagramClickUrl && (
                    <a
                      href={contactLinks.instagramClickUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-pink-700 hover:underline flex items-center gap-1 font-mono"
                      title="Test Instagram Link"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>View Profile</span>
                    </a>
                  )}
                </div>
                <input
                  type="text"
                  required
                  value={settings.instagram_handle || ''}
                  onChange={(e) => setSettings({ ...settings, instagram_handle: e.target.value })}
                  placeholder="@lkbakehouse_tz"
                  className="w-full px-3 py-2 bg-white border border-[#E8DFD8] rounded-lg font-mono"
                />
                <span className="text-[10px] text-stone-400 block">Profile URL: {contactLinks.instagramClickUrl || 'https://instagram.com/...'}</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={savingSettings}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#C85A32] hover:bg-[#B34F2B] text-white text-xs font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{savingSettings ? 'Saving...' : 'Save Contact Channels'}</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 2: AUTOMATED MESSAGE TEMPLATES (ALL 12 SCENARIOS) */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Template Selection List */}
          <div className="lg:col-span-5 bg-white rounded-xl border border-[#E8DFD8] shadow-xs flex flex-col overflow-hidden">
            <div className="p-3 bg-[#FAF7F2] border-b border-[#E8DFD8]">
              <h4 className="font-bold text-xs text-[#292524]">
                Automated Message Templates ({templates.length})
              </h4>
              <p className="text-[11px] text-[#78716C] mt-0.5">
                Strict status safeguards: templates distinguish receipt from acceptance and verified payments.
              </p>
            </div>

            <div className="divide-y divide-[#F0EAE1] overflow-y-auto max-h-[550px]">
              {templates.map((tmpl) => {
                const isSelected = selectedTemplate?.templateKey === tmpl.templateKey;
                return (
                  <div
                    key={tmpl.id}
                    onClick={() => handleSelectTemplate(tmpl)}
                    className={`p-3 cursor-pointer transition-colors text-xs ${
                      isSelected
                        ? 'bg-amber-50/70 border-l-4 border-l-[#C85A32]'
                        : 'hover:bg-[#FAF7F2]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-[#292524]">{tmpl.title}</span>
                      <span className="font-mono text-[10px] px-1.5 py-0.5 bg-white border border-[#E8DFD8] rounded text-[#78716C]">
                        {tmpl.channel}
                      </span>
                    </div>
                    <span className="font-mono text-[10px] text-stone-400 block">
                      Trigger: {tmpl.triggerEvent}
                    </span>
                    <p className="text-[11px] text-[#78716C] truncate mt-1">
                      {tmpl.bodyTemplate}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Template Editor & Variable Tokens */}
          <div className="lg:col-span-7 bg-white rounded-xl border border-[#E8DFD8] shadow-xs p-5 space-y-4 flex flex-col">
            {selectedTemplate ? (
              <form onSubmit={handleSaveTemplate} className="space-y-4">
                <div className="flex items-start justify-between pb-3 border-b border-[#E8DFD8]">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-[#C85A32] uppercase">
                      Template Key: {selectedTemplate.templateKey}
                    </span>
                    <h4 className="font-display text-base font-bold text-[#292524]">
                      {selectedTemplate.title}
                    </h4>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={templateEnabled}
                      onChange={(e) => setTemplateEnabled(e.target.checked)}
                      className="rounded text-[#C85A32]"
                    />
                    <span className="text-xs font-semibold text-[#292524]">Enabled</span>
                  </label>
                </div>

                {templateSaveSuccess && (
                  <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-semibold text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Message template updated in PostgreSQL!</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-[#78716C] uppercase mb-1">
                      Channel Delivery Target
                    </label>
                    <select
                      value={templateChannel}
                      onChange={(e) => setTemplateChannel(e.target.value as any)}
                      className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DFD8] rounded-lg text-xs"
                    >
                      <option value="in_app">In-App Notification & Tracking Modal</option>
                      <option value="whatsapp">WhatsApp Business API</option>
                      <option value="email">Transactional Email</option>
                      <option value="sms">SMS Gateway</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#78716C] uppercase mb-1">
                      Message Subject Line
                    </label>
                    <input
                      type="text"
                      value={templateSubject}
                      onChange={(e) => setTemplateSubject(e.target.value)}
                      placeholder="Subject line..."
                      className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DFD8] rounded-lg text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#78716C] uppercase mb-1">
                    Body Template (Supports Variable Substitution) *
                  </label>
                  <textarea
                    rows={5}
                    required
                    value={templateBody}
                    onChange={(e) => setTemplateBody(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DFD8] rounded-lg text-xs font-mono leading-relaxed focus:outline-hidden focus:border-[#C85A32]"
                  />
                </div>

                {/* Available Variables Guide */}
                <div className="p-3 bg-[#FAF7F2] rounded-xl border border-[#E8DFD8] space-y-2">
                  <span className="font-bold text-[11px] text-[#292524] block">
                    Available Dynamic Variables:
                  </span>
                  <div className="flex flex-wrap gap-1.5 text-[10px]">
                    {variableTokens.map((t) => (
                      <span
                        key={t.token}
                        onClick={() => setTemplateBody((prev) => prev + ' ' + t.token)}
                        className="px-2 py-0.5 bg-white border border-[#E8DFD8] rounded cursor-pointer hover:border-[#C85A32] font-mono text-[#57534E]"
                        title={t.desc}
                      >
                        {t.token}
                      </span>
                    ))}
                  </div>
                  <p className="text-[10px] text-stone-400">
                    Click any token above to append it into your message template.
                  </p>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={savingTemplate}
                    className="flex items-center gap-2 px-5 py-2 bg-[#C85A32] hover:bg-[#B34F2B] text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
                  >
                    <Save className="w-4 h-4" />
                    <span>{savingTemplate ? 'Saving Template...' : 'Save Template Changes'}</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-center text-stone-400 py-12 text-xs">
                Select a message template on the left to edit.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 3: EXTERNAL DISPATCHES LOG & VERIFICATION */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'dispatches' && (
        <div className="space-y-6">
          {/* External Message Simulator & Verification Test Bar */}
          <div className="bg-white p-5 rounded-xl border border-[#E8DFD8] shadow-xs space-y-4">
            <div>
              <h4 className="font-display text-base font-bold text-[#292524]">
                External Channel Dispatch Simulator & Gateway Verification
              </h4>
              <p className="text-xs text-[#78716C] mt-0.5">
                Clearly distinguishes in-app website notifications from external gateway dispatches. External messages are verified through API callbacks and never claimed as sent unless confirmed.
              </p>
            </div>

            <form onSubmit={handleTestDispatch} className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs items-end">
              <div>
                <label className="block text-[11px] font-bold text-[#78716C] uppercase mb-1">
                  Channel Gateway
                </label>
                <select
                  value={testChannel}
                  onChange={(e) => setTestChannel(e.target.value as any)}
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DFD8] rounded-lg"
                >
                  <option value="whatsapp">WhatsApp Business API</option>
                  <option value="sms">SMS Gateway (AfricasTalking/Twilio)</option>
                  <option value="email">Transactional Email (SendGrid/Resend)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#78716C] uppercase mb-1">
                  Recipient
                </label>
                <input
                  type="text"
                  required
                  value={testRecipient}
                  onChange={(e) => setTestRecipient(e.target.value)}
                  placeholder="+255 7XX XXX XXX or user@email.com"
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DFD8] rounded-lg font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#78716C] uppercase mb-1">
                  Test Failure Simulation
                </label>
                <label className="flex items-center gap-2 px-3 py-2 bg-[#FAF7F2] border border-[#E8DFD8] rounded-lg cursor-pointer">
                  <input
                    type="checkbox"
                    checked={simulateFailure}
                    onChange={(e) => setSimulateFailure(e.target.checked)}
                    className="rounded text-red-600"
                  />
                  <span className="text-[11px] text-red-700 font-semibold">Simulate Gateway Failure</span>
                </label>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isDispatching}
                  className="w-full py-2 bg-[#292524] hover:bg-stone-800 text-white rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isDispatching ? 'Testing...' : 'Test External Dispatch'}</span>
                </button>
              </div>
            </form>

            {/* Test Result Callout */}
            {dispatchStatusResult && (
              <div className={`p-3.5 rounded-xl text-xs border ${
                dispatchStatusResult.ok
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-red-50 border-red-200 text-red-900'
              }`}>
                <div className="font-bold flex items-center gap-1.5">
                  {dispatchStatusResult.ok ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-red-600" />}
                  <span>{dispatchStatusResult.ok ? 'Gateway Dispatch Confirmed & Verified' : 'Gateway Dispatch Rejected / Failed'}</span>
                </div>
                <p className="mt-1 font-mono text-[11px]">
                  Status: {dispatchStatusResult.data.deliveryStatus || 'error'} | Ref: {dispatchStatusResult.data.gatewayReference || 'None'}
                </p>
                {dispatchStatusResult.data.notice && (
                  <p className="text-[11px] mt-0.5">{dispatchStatusResult.data.notice}</p>
                )}
                {dispatchStatusResult.data.error && (
                  <p className="text-[11px] mt-0.5 text-red-700">{dispatchStatusResult.data.error}</p>
                )}
              </div>
            )}
          </div>

          {/* Dispatches Table */}
          <div className="bg-white rounded-xl border border-[#E8DFD8] shadow-xs overflow-hidden">
            <div className="p-4 bg-[#FAF7F2] border-b border-[#E8DFD8] flex items-center justify-between">
              <div>
                <h4 className="font-bold text-xs text-[#292524]">
                  External Message Dispatch Ledger (Audit Trail)
                </h4>
                <span className="text-[10px] text-[#78716C]">
                  Chronological record of SMS, WhatsApp, and transactional emails with gateway verification
                </span>
              </div>
              <button
                onClick={fetchDispatches}
                className="p-1.5 bg-white border border-[#E8DFD8] rounded text-stone-600 hover:text-stone-900 text-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF7F2] text-[#78716C] uppercase font-semibold text-[10px] border-b border-[#E8DFD8]">
                  <tr>
                    <th className="py-2.5 px-4">Timestamp</th>
                    <th className="py-2.5 px-4">Channel</th>
                    <th className="py-2.5 px-4">Recipient</th>
                    <th className="py-2.5 px-4">Gateway Reference</th>
                    <th className="py-2.5 px-4">Delivery Status</th>
                    <th className="py-2.5 px-4">Message Excerpt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0EAE1]">
                  {loadingDispatches ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-stone-400">
                        Loading external dispatches...
                      </td>
                    </tr>
                  ) : dispatches.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-stone-400">
                        No external message dispatches recorded yet. Use the test bar above to trigger a dispatch.
                      </td>
                    </tr>
                  ) : (
                    dispatches.map((d) => (
                      <tr key={d.id} className="hover:bg-[#FAF7F2]">
                        <td className="py-2.5 px-4 font-mono text-[11px] text-[#78716C]">
                          {formatDate(d.createdAt)}
                        </td>
                        <td className="py-2.5 px-4 uppercase font-bold text-[10px]">
                          {d.channel}
                        </td>
                        <td className="py-2.5 px-4 font-mono text-[11px] text-[#292524]">
                          {d.recipient}
                        </td>
                        <td className="py-2.5 px-4 font-mono text-[10px] text-stone-500">
                          {d.gatewayReference || '—'}
                        </td>
                        <td className="py-2.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              d.deliveryStatus === 'delivered' || d.deliveryStatus === 'sent'
                                ? 'bg-emerald-100 text-emerald-800'
                                : d.deliveryStatus === 'suppressed'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {d.deliveryStatus}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-[#78716C] max-w-xs truncate">
                          {d.messageBody}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 4: GENERAL BAKERY PROFILE */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'general' && (
        <form onSubmit={handleSaveContactSettings} className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-[#E8DFD8] shadow-xs space-y-4">
            <h4 className="font-display text-base font-bold text-[#292524] pb-2 border-b border-[#E8DFD8]">
              Bakery Store Identity & Operational Limits
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-[#78716C] uppercase mb-1">
                  Trading Name
                </label>
                <input
                  type="text"
                  value={settings.bakery_name || ''}
                  onChange={(e) => setSettings({ ...settings, bakery_name: e.target.value })}
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DFD8] rounded-lg"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#78716C] uppercase mb-1">
                  Operating Currency
                </label>
                <input
                  type="text"
                  readOnly
                  value="TZS (Tanzanian Shilling)"
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DFD8] rounded-lg font-mono text-stone-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#78716C] uppercase mb-1">
                  Store Physical Address
                </label>
                <input
                  type="text"
                  value={settings.physical_location || ''}
                  onChange={(e) => setSettings({ ...settings, physical_location: e.target.value })}
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DFD8] rounded-lg"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#78716C] uppercase mb-1">
                  Opening & Baking Hours
                </label>
                <input
                  type="text"
                  value={settings.operating_hours || ''}
                  onChange={(e) => setSettings({ ...settings, operating_hours: e.target.value })}
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DFD8] rounded-lg"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#78716C] uppercase mb-1">
                  Standard Flat Delivery Fee (TSh)
                </label>
                <input
                  type="number"
                  value={settings.delivery_fee_base_tzs || '7000'}
                  onChange={(e) => setSettings({ ...settings, delivery_fee_base_tzs: e.target.value })}
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DFD8] rounded-lg font-mono font-bold"
                />
              </div>
            </div>

            <div className="flex justify-end pt-3">
              <button
                type="submit"
                disabled={savingSettings}
                className="flex items-center gap-2 px-6 py-2 bg-[#C85A32] hover:bg-[#B34F2B] text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>Save Profile</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 5: STAFF & ROLES */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'staff' && (
        <div className="bg-white rounded-xl border border-[#E8DFD8] shadow-xs overflow-hidden">
          <div className="p-4 bg-[#FAF7F2] border-b border-[#E8DFD8] flex items-center justify-between">
            <div>
              <h4 className="font-bold text-xs text-[#292524]">
                Staff Accounts & Role-Based Access Control
              </h4>
              <p className="text-[11px] text-[#78716C]">
                Enforces administrative, cashier, baker, and manager permissions across all operations.
              </p>
            </div>
            <button
              onClick={fetchStaff}
              className="p-1.5 bg-white border border-[#E8DFD8] rounded text-stone-600 hover:text-stone-900 text-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF7F2] text-[#78716C] uppercase text-[10px] font-semibold border-b border-[#E8DFD8]">
              <tr>
                <th className="py-2.5 px-4">Staff Member</th>
                <th className="py-2.5 px-4">Email</th>
                <th className="py-2.5 px-4">Current Role</th>
                <th className="py-2.5 px-4">Update Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EAE1]">
              {loadingStaff ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-stone-400">
                    Loading staff accounts...
                  </td>
                </tr>
              ) : (
                staffList.map((user) => (
                  <tr key={user.id} className="hover:bg-[#FAF7F2]">
                    <td className="py-3 px-4 font-semibold text-[#292524]">
                      {user.displayName || user.fullName || 'Bakery Staff'}
                    </td>
                    <td className="py-3 px-4 font-mono text-stone-600">
                      {user.email}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-stone-100 text-stone-800 border border-stone-200">
                        {user.role}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={user.role}
                        disabled={updatingRoleId === user.id}
                        onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                        className="px-2 py-1 bg-[#FAF7F2] border border-[#E8DFD8] rounded text-xs text-[#292524]"
                      >
                        <option value="admin">Admin</option>
                        <option value="manager">Manager</option>
                        <option value="cashier">Cashier</option>
                        <option value="baker">Baker</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 6: DATABASE & REAL-TIME */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'database' && (
        <div className="bg-white p-6 rounded-xl border border-[#E8DFD8] shadow-xs space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-[#E8DFD8]">
            <Database className="w-5 h-5 text-[#C85A32]" />
            <div>
              <h4 className="font-display text-base font-bold text-[#292524]">
                PostgreSQL & Real-Time Connection
              </h4>
              <p className="text-xs text-[#78716C]">
                Integrated database architecture powering storefront orders, POS transactions, inventory movements, and support threads.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 bg-[#FAF7F2] rounded-xl border border-[#E8DFD8] space-y-1">
              <span className="text-[10px] text-stone-400 uppercase font-bold">Relational Database:</span>
              <strong className="text-[#292524] text-sm block">PostgreSQL 15+ (External Cloud DB)</strong>
              <span className="text-emerald-700 font-semibold block text-[11px]">Connected via Connection URI</span>
            </div>

            <div className="p-4 bg-[#FAF7F2] rounded-xl border border-[#E8DFD8] space-y-1">
              <span className="text-[10px] text-stone-400 uppercase font-bold">Live Stream Broadcaster:</span>
              <strong className="text-[#292524] text-sm block">SSE & Supabase Channels</strong>
              <span className="text-emerald-700 font-semibold block text-[11px]">Instant staff dispatch alerts</span>
            </div>

            <div className="p-4 bg-[#FAF7F2] rounded-xl border border-[#E8DFD8] space-y-1">
              <span className="text-[10px] text-stone-400 uppercase font-bold">ORM Layer:</span>
              <strong className="text-[#292524] text-sm block">Drizzle ORM</strong>
              <span className="text-stone-600 block text-[11px]">Type-safe schemas and queries</span>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 7: INTEGRATION TEST SUITE */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'tests' && (
        <div className="bg-white p-6 rounded-xl border border-[#E8DFD8] shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E8DFD8]">
            <div>
              <h4 className="font-display text-base font-bold text-[#292524]">
                Automated System Integration Test Runner
              </h4>
              <p className="text-xs text-[#78716C]">
                Verifies database queries, catalog search, order creation, notifications, and real-time SSE broadcasts.
              </p>
            </div>

            <button
              onClick={handleRunTests}
              disabled={isRunningTests}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#C85A32] hover:bg-[#B34F2B] disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition-colors"
            >
              <Play className="w-3.5 h-3.5" />
              <span>{isRunningTests ? 'Running Tests...' : 'Run Test Suite'}</span>
            </button>
          </div>

          {overallTestStatus && (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-bold border border-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Suite Result: {overallTestStatus}</span>
            </div>
          )}

          <div className="divide-y divide-[#F0EAE1]">
            {testResults?.map((r, idx) => (
              <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <strong className="text-[#292524] block">{r.test}</strong>
                  <span className="text-[11px] text-[#78716C]">{r.details}</span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    r.status === 'PASSED'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {r.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
