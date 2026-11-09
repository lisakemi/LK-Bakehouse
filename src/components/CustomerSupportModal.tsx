import React, { useState, useEffect, useRef } from 'react';
import {
  UserCheck,
  Send,
  MessageSquare,
  ShieldAlert,
  Clock,
  CheckCircle2,
  Phone,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { formatDate } from '../utils/format.ts';

interface CustomerSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultOrderNumber?: string;
  defaultCustomerName?: string;
  defaultCustomerPhone?: string;
}

export const CustomerSupportModal: React.FC<CustomerSupportModalProps> = ({
  isOpen,
  onClose,
  defaultOrderNumber = '',
  defaultCustomerName = '',
  defaultCustomerPhone = '',
}) => {
  // If no ticket is active, show the "Request Human Representative" form
  const [activeTicket, setActiveTicket] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);

  // Form inputs
  const [customerName, setCustomerName] = useState(defaultCustomerName);
  const [customerPhone, setCustomerPhone] = useState(defaultCustomerPhone);
  const [customerEmail, setCustomerEmail] = useState('');
  const [orderNumber, setOrderNumber] = useState(defaultOrderNumber);
  const [subject, setSubject] = useState('Need assistance with my bakery order');
  const [message, setMessage] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (defaultOrderNumber) setOrderNumber(defaultOrderNumber);
    if (defaultCustomerName) setCustomerName(defaultCustomerName);
    if (defaultCustomerPhone) setCustomerPhone(defaultCustomerPhone);
  }, [defaultOrderNumber, defaultCustomerName, defaultCustomerPhone]);

  useEffect(() => {
    let interval: any;
    if (activeTicket?.id) {
      fetchTicketDetails(activeTicket.id);
      interval = setInterval(() => {
        fetchTicketDetails(activeTicket.id);
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [activeTicket?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchTicketDetails = async (ticketId: string) => {
    try {
      const res = await fetch(`/api/support/requests/${ticketId}`);
      if (res.ok) {
        const data = await res.json();
        setActiveTicket(data);
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error('Error fetching ticket details:', err);
    }
  };

  const handleCreateSupportRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !message.trim()) return;
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/support/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim() || undefined,
          customerEmail: customerEmail.trim() || undefined,
          orderNumber: orderNumber.trim() || undefined,
          subject: subject.trim(),
          message: message.trim(),
          channel: 'web_chat',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to connect with representative');

      setActiveTicket(data.ticket);
      fetchTicketDetails(data.ticket.id);
    } catch (err: any) {
      setError(err.message || 'Error creating support request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendCustomerReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !activeTicket?.id) return;
    setSendingReply(true);

    try {
      const res = await fetch(`/api/support/requests/${activeTicket.id}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageText: replyText.trim(),
          senderType: 'customer',
          senderName: customerName.trim() || 'Customer',
        }),
      });

      if (res.ok) {
        setReplyText('');
        fetchTicketDetails(activeTicket.id);
      }
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setSendingReply(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-[#E8DFD8] overflow-hidden flex flex-col max-h-[85vh]">
        {/* Top Header */}
        <div className="bg-[#292524] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-display text-base font-bold">
                Speak to a Human Representative
              </h3>
              <p className="text-[11px] text-stone-300">
                Direct concierge support from LK Bakehouse Masaki
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-stone-400 hover:text-white text-xl leading-none p-1"
          >
            ✕
          </button>
        </div>

        {/* Human Representative Safety Guarantee Notice */}
        <div className="bg-emerald-50 p-3 border-b border-emerald-200/80 text-[11px] text-emerald-900 flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
          <div>
            <strong>Automated Contradiction Safeguard:</strong> When speaking to a human, bot replies are temporarily paused so you receive authoritative answers directly from our bakery manager.
          </div>
        </div>

        {/* Content Area */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4 text-xs">
          {!activeTicket ? (
            /* Creation Form */
            <form onSubmit={handleCreateSupportRequest} className="space-y-3.5">
              {error && (
                <div className="p-3 bg-red-50 text-red-700 rounded-lg text-xs border border-red-200">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-[#78716C] uppercase mb-1">
                  Your Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Lisa Rutasitara"
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DFD8] rounded-lg text-xs font-medium focus:outline-hidden focus:border-[#C85A32]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-[#78716C] uppercase mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="+255 7XX XXX XXX"
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DFD8] rounded-lg text-xs focus:outline-hidden focus:border-[#C85A32]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#78716C] uppercase mb-1">
                    Order Reference # (Optional)
                  </label>
                  <input
                    type="text"
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value)}
                    placeholder="e.g. LKB-2026-XXXX"
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DFD8] rounded-lg font-mono text-xs focus:outline-hidden focus:border-[#C85A32]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#78716C] uppercase mb-1">
                  Subject / Topic *
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Dietary allergy question / delivery timing update"
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DFD8] rounded-lg text-xs focus:outline-hidden focus:border-[#C85A32]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#78716C] uppercase mb-1">
                  Your Question or Message for Staff *
                </label>
                <textarea
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your inquiry or request so our staff can assist you immediately..."
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8DFD8] rounded-lg text-xs focus:outline-hidden focus:border-[#C85A32]"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-semibold rounded-lg text-xs flex items-center justify-center gap-2 transition-colors shadow-xs"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Connecting with Staff...</span>
                  </>
                ) : (
                  <>
                    <UserCheck className="w-4 h-4" />
                    <span>Request Human Representative</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Live Support Conversation Thread */
            <div className="flex flex-col h-full space-y-3">
              {/* Ticket Status Bar */}
              <div className="p-3 bg-[#FAF7F2] rounded-xl border border-[#E8DFD8] flex items-center justify-between text-[11px]">
                <div>
                  <span className="text-[#78716C] block font-mono">Ticket #{activeTicket.ticketNumber}</span>
                  <strong className="text-[#292524]">{activeTicket.subject}</strong>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                    activeTicket.status === 'resolved'
                      ? 'bg-stone-200 text-stone-800'
                      : activeTicket.status === 'in_progress'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {activeTicket.status.replace(/_/g, ' ')}
                  </span>
                  <span className="text-[10px] text-stone-400 block mt-0.5">
                    Bot replies: {activeTicket.isAutomatedRepliesPaused ? 'Paused' : 'Active'}
                  </span>
                </div>
              </div>

              {/* Message Scroll Area */}
              <div className="space-y-2.5 min-h-[220px] max-h-[300px] overflow-y-auto p-2 bg-stone-50/60 rounded-xl border border-stone-200/80">
                {messages.map((m: any) => {
                  const isCustomer = m.senderType === 'customer';
                  const isSystem = m.senderType === 'system';

                  if (isSystem) {
                    return (
                      <div key={m.id} className="text-center my-2">
                        <span className="inline-block px-3 py-1 bg-amber-50 border border-amber-200 text-amber-900 rounded-full text-[10px] italic">
                          {m.messageText}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isCustomer ? 'items-end' : 'items-start'}`}
                    >
                      <span className="text-[10px] text-[#78716C] px-1 mb-0.5">
                        {m.senderName} ({isCustomer ? 'You' : 'LK Staff'})
                      </span>
                      <div
                        className={`max-w-[85%] px-3 py-2 rounded-xl text-xs ${
                          isCustomer
                            ? 'bg-[#C85A32] text-white rounded-br-xs'
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

              {/* Reply Input */}
              {activeTicket.status !== 'resolved' ? (
                <form onSubmit={handleSendCustomerReply} className="flex gap-2 pt-2 border-t border-[#E8DFD8]">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type message to human representative..."
                    className="flex-1 px-3 py-2 bg-[#FAF7F2] border border-[#E8DFD8] rounded-lg text-xs focus:outline-hidden focus:border-[#C85A32]"
                  />
                  <button
                    type="submit"
                    disabled={sendingReply || !replyText.trim()}
                    className="px-4 py-2 bg-[#C85A32] hover:bg-[#B34F2B] disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send</span>
                  </button>
                </form>
              ) : (
                <div className="p-3 bg-stone-100 rounded-xl text-center text-[11px] text-[#78716C]">
                  This support request has been marked as resolved by staff.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-[#FAF7F2] border-t border-[#E8DFD8] flex items-center justify-between text-[11px] text-[#78716C]">
          <span>Hotline: +255 754 889 900</span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-white hover:bg-stone-50 border border-[#E8DFD8] rounded text-[#57534E] text-xs font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
