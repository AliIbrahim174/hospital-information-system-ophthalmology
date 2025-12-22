import React, { useEffect, useState } from "react";
import { dataService } from "../services/dataService";
import { ContactMessage } from "../types";

interface IncidentReporterProps {
  currentUser?: { name: string; role: string; id: string } | null;
}

const IncidentReporter: React.FC<IncidentReporterProps> = ({ currentUser }) => {
  const role = currentUser?.role;

  // Admin inbox
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loadingInbox, setLoadingInbox] = useState(false);

  // Contact form
  const [name, setName] = useState(currentUser?.name || "");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("Help");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const refreshInbox = async () => {
    if (role !== "Admin") return;
    try {
      setError(null);
      setLoadingInbox(true);
      const list = await dataService.getMessages();
      setMessages(list);
    } catch (e: any) {
      console.error(e);
      setError(e?.message || "Failed to load messages.");
    } finally {
      setLoadingInbox(false);
    }
  };

  useEffect(() => {
    // Only admin loads inbox
    refreshInbox();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setError(null);
      setSuccess(null);

      if (!name.trim()) throw new Error("Name is required.");
      if (!email.trim()) throw new Error("Email is required.");
      if (!message.trim()) throw new Error("Message is required.");

      setSending(true);

      await dataService.submitContactMessage({
        name: name.trim(),
        email: email.trim(),
        subject: subject.trim() || "Help",
        message: message.trim(),
      });

      setSuccess("Message sent successfully ✅");
      setMessage("");

      // If admin is also using the form, refresh inbox
      await refreshInbox();
    } catch (e: any) {
      console.error(e);
      setError(e?.message || "Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Messages & Support</h2>
        <p className="text-slate-500">
          Send a message to the clinic administration, or review inbox (Admin only).
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl border border-green-200 bg-green-50 text-green-700">
          {success}
        </div>
      )}

      {/* Contact Form (everyone) */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Contact Form</h3>

        <form onSubmit={handleSend} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-1">
            <label className="text-sm font-medium text-slate-700">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200"
              placeholder="Your name"
            />
          </div>

          <div className="md:col-span-1">
            <label className="text-sm font-medium text-slate-700">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200"
              placeholder="you@example.com"
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-sm font-medium text-slate-700">Subject</label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200"
              placeholder="Subject"
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-sm font-medium text-slate-700">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 min-h-[120px]"
              placeholder="Write your message..."
            />
          </div>

          <div className="md:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={sending}
              className="px-5 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-60"
            >
              {sending ? "Sending..." : "Send Message"}
            </button>
          </div>
        </form>
      </div>

      {/* Admin Inbox */}
      {role === "Admin" && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-800">Admin Inbox</h3>
            <button
              onClick={refreshInbox}
              className="px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50"
              disabled={loadingInbox}
            >
              {loadingInbox ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          {loadingInbox ? (
            <div className="text-slate-500">Loading messages…</div>
          ) : messages.length === 0 ? (
            <div className="text-slate-500">No messages yet.</div>
          ) : (
            <div className="space-y-3">
              {messages.map((m) => (
                <div
                  key={String(m.message_id)}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <div>
                      <div className="font-bold text-slate-800">{m.subject || "No subject"}</div>
                      <div className="text-sm text-slate-600">
                        From: <span className="font-medium">{m.name}</span> ({m.email})
                      </div>
                    </div>
                    <div className="text-xs text-slate-500">
                      Status: <span className="font-semibold">{m.status}</span>
                      {m.created_at ? ` • ${new Date(m.created_at).toLocaleString()}` : ""}
                    </div>
                  </div>

                  <div className="mt-3 text-slate-700 whitespace-pre-wrap">{m.message}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default IncidentReporter;
