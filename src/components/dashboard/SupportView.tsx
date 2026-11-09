import React, { useState, useEffect, useRef } from 'react';
import { SupportRequest, SupportMessage } from '../../types/bakery.ts';
import { formatDate } from '../../utils/format.ts';
import {
  MessageSquare,
  UserCheck,
  Send,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Search,
  Filter,
  RefreshCw,
  Phone,
  Mail,
  ExternalLink,
  Bot,
  AlertTriangle,
} from 'lucide-react';

export const SupportView: React.FC = () => {
  const [tickets, setTickets] = useState<SupportRequest[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingTicket, setLoadingTicket] = useState(false);

  // Filters & search
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Reply form
  const [replyText, setReplyText] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  // Resolve modal / inputs
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resumeAutomationOnResolve, setResumeAutomationOnResolve] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchTickets();
    const interval = setInterval(fetchTickets, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedTicketId) {
      fetchTicketDetails(selectedTicketId);
    }
  }, [selectedTicketId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchTickets = async () => {
    try {
      const res = await fetch('/api/support/requests');
      const data = await res.json();
      if (Array.isArray(data)) {
        setTickets(data);
        if (!selectedTicketId && data.length > 0) {
          setSelectedTicketId(data[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching support requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTicketDetails = async (id: string) => {
    setLoadingTicket(true);
    try {
      const res = await fetch(`/api/support/requests/${id}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedTicket(data);
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error('Error fetching ticket details:', err);
    } finally {
      setLoadingTicket(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicketId) return;
    setIsSubmittingReply(true);

    try {
      const res = await fetch(`/api/support/requests/${selectedTicketId}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageText: replyText.trim(),
          senderType: 'staff',
          senderName: 'LK Bakehouse Masaki Manager',
        }),
      });

      if (res.ok) {
        setReplyText('');
        fetchTicketDetails(selectedTicketId);
        fetchTickets();
      }
    } catch (err) {
      console.error('Error sending staff reply:', err);
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleToggleAutomation = async () => {
    if (!selectedTicketId || !selectedTicket) return;
    const nextState = !selectedTicket.isAutomatedRepliesPaused;
    try {
      const res = await fetch(`/api/support/requests/${selectedTicketId}/toggle-automation`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAutomatedRepliesPaused: nextState }),
      });
      if (res.ok) {
        setSelectedTicket((prev: any) => ({ ...prev, isAutomatedRepliesPaused: nextState }));
        fetchTickets();
      }
    } catch (err) {
      console.error('Error toggling automation:', err);
    }
  };

  const handleResolveTicket = async () => {
    if (!selectedTicketId) return;
    try {
      const res = await fetch(`/api/support/requests/${selectedTicketId}/resolve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resolutionNotes: resolutionNotes.trim() || 'Resolved by bakery staff',
          resumeAutomation: resumeAutomationOnResolve,
        }),
      });

      if (res.ok) {
        setShowResolveModal(false);
        setResolutionNotes('');
        fetchTicketDetails(selectedTicketId);
        fetchTickets();
      }
    } catch (err) {
      console.error('Error resolving support ticket:', err);
    }
  };

  const filteredTickets = tickets.filter((t) => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNum = t.ticketNumber.toLowerCase().includes(q);
      const matchCust = t.customerName.toLowerCase().includes(q);
      const matchSub = t.subject.toLowerCase().includes(q);
      const matchOrder = t.orderNumber?.toLowerCase().includes(q);
      if (!matchNum && !matchCust && !matchSub && !matchOrder) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-white p-5 rounded-xl border border-[#E8DFD8] shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="font-display text-lg font-bold text-[#292524] flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-[#C85A32]" />
            <span>Customer Support & Human Handoff Desk</span>
          </h3>
          <p className="text-xs text-[#78716C] mt-0.5">
            Manage customer requests to speak with human staff, review conversations, prevent automated contradiction, and resolve inquiries.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchTickets()}
            className="p-2 bg-white border border-[#E8DFD8] hover:bg-[#FAF7F2] text-[#57534E] rounded-lg text-xs font-medium transition-colors"
            title="Refresh Tickets"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Two-Column Split: Ticket List (Left) & Active Thread (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[600px]">
        {/* LEFT COLUMN: Tickets Queue */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-[#E8DFD8] shadow-xs flex flex-col overflow-hidden">
          {/* Filters & Search */}
          <div className="p-3 border-b border-[#E8DFD8] space-y-2.5 bg-[#FAF7F2]">
            <div className="relative">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ticket #, customer, order..."
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-[#E8DFD8] rounded-lg text-xs focus:outline-hidden focus:border-[#C85A32]"
              />
            </div>

            <div className="flex gap-1">
              {[
                { id: 'all', label: 'All' },
                { id: 'open', label: 'Open' },
                { id: 'in_progress', label: 'In Progress' },
                { id: 'resolved', label: 'Resolved' },
              ].map((btn) => (
                <button
                  key={btn.id}
                  onClick={() => setStatusFilter(btn.id as any)}
                  className={`flex-1 py-1 text-[11px] font-semibold rounded-md transition-colors ${
                    statusFilter === btn.id
                      ? 'bg-[#292524] text-white'
                      : 'bg-white border border-[#E8DFD8] text-[#57534E] hover:bg-stone-50'
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>

          {/* Ticket Cards List */}
          <div className="divide-y divide-[#F0EAE1] overflow-y-auto flex-1 max-h-[550px]">
            {loading ? (
              <div className="p-8 text-center text-stone-400 text-xs">
                Loading support tickets...
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="p-8 text-center text-stone-400 text-xs">
                No support requests found.
              </div>
            ) : (
              filteredTickets.map((t) => {
                const isSelected = selectedTicketId === t.id;
                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTicketId(t.id)}
                    className={`p-3.5 cursor-pointer transition-colors text-xs ${
                      isSelected
                        ? 'bg-amber-50/60 border-l-4 border-l-[#C85A32]'
                        : 'hover:bg-[#FAF7F2]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-[11px] font-bold text-[#C85A32]">
                        {t.ticketNumber}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          t.status === 'open'
                            ? 'bg-amber-100 text-amber-800'
                            : t.status === 'in_progress'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-stone-100 text-stone-600'
                        }`}
                      >
                        {t.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <strong className="text-[#292524] block truncate">
                      {t.customerName}
                    </strong>
                    <p className="text-[11px] text-[#78716C] truncate mt-0.5">
                      {t.subject}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-stone-400 mt-2">
                      <span>{t.orderNumber ? `Order #${t.orderNumber}` : 'General Inquiry'}</span>
                      <span>{formatDate(t.createdAt)}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Active Ticket Conversation & Controls */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-[#E8DFD8] shadow-xs flex flex-col overflow-hidden">
          {!selectedTicket ? (
            <div className="flex-1 flex items-center justify-center p-8 text-center text-stone-400 text-xs">
              Select a customer support ticket on the left to view the thread and respond.
            </div>
          ) : (
            <>
              {/* Ticket Top Info Header */}
              <div className="p-4 border-b border-[#E8DFD8] bg-[#FAF7F2] space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-[#C85A32]">
                        {selectedTicket.ticketNumber}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          selectedTicket.status === 'open'
                            ? 'bg-amber-100 text-amber-800'
                            : selectedTicket.status === 'in_progress'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-stone-100 text-stone-600'
                        }`}
                      >
                        {selectedTicket.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <h4 className="font-bold text-[#292524] text-sm mt-0.5">
                      {selectedTicket.subject}
                    </h4>
                  </div>

                  <div className="flex items-center gap-2">
                    {selectedTicket.status !== 'resolved' ? (
                      <button
                        onClick={() => setShowResolveModal(true)}
                        className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Resolve Ticket</span>
                      </button>
                    ) : (
                      <span className="px-3 py-1 bg-stone-100 text-stone-600 rounded-lg text-xs font-medium border border-stone-200">
                        Resolved on {formatDate(selectedTicket.resolvedAt)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Customer Details Pill */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] pt-1">
                  <div className="p-2 bg-white rounded-lg border border-[#E8DFD8]">
                    <span className="text-stone-400 block text-[10px] uppercase">Customer:</span>
                    <strong className="text-[#292524]">{selectedTicket.customerName}</strong>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-[#E8DFD8]">
                    <span className="text-stone-400 block text-[10px] uppercase">Phone:</span>
                    <span className="font-mono text-[#292524]">{selectedTicket.customerPhone || 'N/A'}</span>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-[#E8DFD8]">
                    <span className="text-stone-400 block text-[10px] uppercase">Order Reference:</span>
                    <span className="font-mono font-bold text-[#C85A32]">
                      {selectedTicket.order?.orderNumber || 'No Order Linked'}
                    </span>
                  </div>
                </div>

                {/* Automated Contradiction Guard Bar */}
                <div className={`p-2.5 rounded-lg border text-xs flex items-center justify-between gap-3 ${
                  selectedTicket.isAutomatedRepliesPaused
                    ? 'bg-amber-50 border-amber-200 text-amber-900'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                }`}>
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <span className="text-[11px]">
                      {selectedTicket.isAutomatedRepliesPaused ? (
                        <><strong>Automated replies are PAUSED.</strong> Bot responses will not contradict your answers.</>
                      ) : (
                        <><strong>Automated replies are ACTIVE.</strong> Standard status messages may be sent to the customer.</>
                      )}
                    </span>
                  </div>

                  <button
                    onClick={handleToggleAutomation}
                    className="px-2.5 py-1 bg-white border border-[#E8DFD8] rounded text-[10px] font-bold uppercase hover:bg-stone-50 transition-colors shrink-0"
                  >
                    {selectedTicket.isAutomatedRepliesPaused ? 'Resume Bot' : 'Pause Bot'}
                  </button>
                </div>
              </div>

              {/* Conversation Messages Thread */}
              <div className="p-4 overflow-y-auto flex-1 space-y-3 bg-[#FAF7F2]/40 min-h-[300px] max-h-[400px]">
                {messages.map((m: any) => {
                  const isStaff = m.senderType === 'staff';
                  const isSystem = m.senderType === 'system';

                  if (isSystem) {
                    return (
                      <div key={m.id} className="text-center my-2">
                        <span className="inline-block px-3 py-1 bg-stone-100 border border-stone-200 text-stone-600 rounded-full text-[10px] italic">
                          {m.messageText}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isStaff ? 'items-end' : 'items-start'}`}
                    >
                      <span className="text-[10px] text-stone-400 px-1 mb-0.5 font-medium">
                        {m.senderName} ({isStaff ? 'Staff' : 'Customer'}) • {formatDate(m.createdAt)}
                      </span>
                      <div
                        className={`max-w-[80%] p-3 rounded-xl text-xs leading-relaxed ${
                          isStaff
                            ? 'bg-[#292524] text-white rounded-br-xs'
                            : 'bg-white border border-[#E8DFD8] text-[#292524] rounded-bl-xs shadow-xs'
                        }`}
                      >
                        {m.messageText}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Staff Reply Form */}
              {selectedTicket.status !== 'resolved' ? (
                <form onSubmit={handleSendReply} className="p-3 border-t border-[#E8DFD8] bg-white flex gap-2">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type official reply to customer..."
                    className="flex-1 px-3 py-2 bg-[#FAF7F2] border border-[#E8DFD8] rounded-lg text-xs focus:outline-hidden focus:border-[#C85A32]"
                  />
                  <button
                    type="submit"
                    disabled={isSubmittingReply || !replyText.trim()}
                    className="px-4 py-2 bg-[#C85A32] hover:bg-[#B34F2B] disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Reply</span>
                  </button>
                </form>
              ) : (
                <div className="p-3 bg-stone-50 border-t border-stone-200 text-center text-xs text-[#78716C]">
                  This ticket has been resolved. Resolution: <em>&ldquo;{selectedTicket.resolutionNotes}&rdquo;</em>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Resolve Ticket Modal */}
      {showResolveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-[#E8DFD8] p-6 space-y-4 text-xs">
            <h4 className="font-display text-base font-bold text-[#292524]">
              Resolve Support Ticket #{selectedTicket?.ticketNumber}
            </h4>
            <p className="text-stone-500 text-xs">
              Enter resolution notes explaining how the customer inquiry was addressed.
            </p>

            <div>
              <label className="block text-[11px] font-bold text-[#78716C] uppercase mb-1">
                Resolution Notes *
              </label>
              <textarea
                rows={3}
                required
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="e.g. Advised customer that batch is fresh in oven; delivery rider contact details provided."
                className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DFD8] rounded-lg text-xs"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={resumeAutomationOnResolve}
                onChange={(e) => setResumeAutomationOnResolve(e.target.checked)}
                className="rounded text-[#C85A32]"
              />
              <span className="text-[#57534E]">Resume automated messaging upon resolving this ticket</span>
            </label>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#E8DFD8]">
              <button
                onClick={() => setShowResolveModal(false)}
                className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 rounded text-stone-600 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleResolveTicket}
                className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded font-semibold"
              >
                Confirm Resolution
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
