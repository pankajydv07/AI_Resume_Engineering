'use client';

import { useState, useEffect } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Mail, 
  Key, 
  Plus, 
  Trash2, 
  RefreshCw, 
  CheckCircle, 
  XCircle,
  Shield,
  Sparkles,
  Bot,
  ExternalLink,
  Copy,
  Check
} from 'lucide-react';
import { toast } from 'sonner';
import { apiUrl } from '@/lib/api';
import { cn } from '@/lib/utils';

interface ApiKey {
  id: string;
  provider: 'AZURE_OPENAI' | 'GEMINI';
  endpoint?: string;
  isValid: boolean;
  lastValidated: string | null;
  validationError: string | null;
  createdAt: string;
}

export default function SettingsPage() {
  const { getToken } = useAuth();
  const { user } = useUser();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [validating, setValidating] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form state
  const [provider, setProvider] = useState<'AZURE_OPENAI' | 'GEMINI'>('GEMINI');
  const [apiKey, setApiKey] = useState('');
  const [endpoint, setEndpoint] = useState('https://models.github.ai/inference');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadApiKeys();
  }, []);

  const loadApiKeys = async () => {
    try {
      const token = await getToken();
      if (!token) {
        toast.error('Not authenticated');
        return;
      }

      const response = await fetch(apiUrl('/api/api-keys'), {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to load API keys');
      const data = await response.json();
      setApiKeys(data);
    } catch (error) {
      toast.error('Failed to load API keys');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddApiKey = async () => {
    if (!apiKey.trim()) {
      toast.error('Please enter an API key');
      return;
    }

    setSaving(true);
    try {
      const token = await getToken();
      
      const body: { provider: string; apiKey: string; endpoint?: string } = {
        provider,
        apiKey,
      };

      if (provider === 'AZURE_OPENAI') {
        body.endpoint = endpoint;
      }

      const response = await fetch(apiUrl('/api/api-keys'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save API key');
      }

      toast.success('API key saved and validated!');
      setShowAddModal(false);
      setApiKey('');
      setEndpoint('https://models.github.ai/inference');
      await loadApiKeys();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save API key');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleValidate = async (id: string) => {
    setValidating(id);
    try {
      const token = await getToken();
      const response = await fetch(apiUrl(`/api/api-keys/${id}/validate`), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Validation failed');
      
      const data = await response.json();
      if (data.isValid) {
        toast.success('API key is valid!');
      } else {
        toast.error(`Validation failed: ${data.validationError}`);
      }
      
      await loadApiKeys();
    } catch (error) {
      toast.error('Failed to validate API key');
      console.error(error);
    } finally {
      setValidating(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this API key?')) return;

    try {
      const token = await getToken();
      const response = await fetch(apiUrl(`/api/api-keys/${id}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to delete API key');
      
      toast.success('API key deleted');
      await loadApiKeys();
    } catch (error) {
      toast.error('Failed to delete API key');
      console.error(error);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center">
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-800/50 border border-white/10">
          <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-300">Loading settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 pt-24 pb-12">
      {/* Background Elements */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-4xl mx-auto px-6">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
          <p className="text-gray-400">Manage your account and AI model preferences</p>
        </motion.div>

        <div className="space-y-6">
          {/* Account Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl bg-gray-900/50 backdrop-blur-sm border border-white/10 overflow-hidden"
          >
            <div className="p-6 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Account</h2>
                  <p className="text-sm text-gray-400">Your profile information</p>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <div className="flex items-start gap-6">
                {/* Avatar */}
                <div className="relative">
                  {user?.imageUrl ? (
                    <img 
                      src={user.imageUrl} 
                      alt="Profile" 
                      className="w-20 h-20 rounded-2xl ring-2 ring-white/10"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                      <User className="w-8 h-8 text-white" />
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-gray-900 flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 space-y-4">
                  <div>
                    <label className="text-xs text-gray-500 uppercase tracking-wider">Full Name</label>
                    <p className="text-white font-medium">{user?.fullName || 'Not set'}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 uppercase tracking-wider">Email Address</label>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-500" />
                      <p className="text-white">{user?.primaryEmailAddress?.emailAddress || 'Not set'}</p>
                      {user?.primaryEmailAddress?.verification?.status === 'verified' && (
                        <span className="px-2 py-0.5 text-xs bg-emerald-500/20 text-emerald-400 rounded-full">Verified</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 uppercase tracking-wider">Member Since</label>
                    <p className="text-gray-300">
                      {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      }) : 'Unknown'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* AI Models Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl bg-gray-900/50 backdrop-blur-sm border border-white/10 overflow-hidden"
          >
            <div className="p-6 border-b border-white/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">AI Models</h2>
                    <p className="text-sm text-gray-400">Configure external AI providers</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium hover:from-blue-500 hover:to-indigo-500 transition-all shadow-lg shadow-blue-500/20"
                >
                  <Plus className="w-4 h-4" />
                  Add Key
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {apiKeys.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-800/50 flex items-center justify-center">
                    <Key className="w-8 h-8 text-gray-500" />
                  </div>
                  <p className="text-white font-medium mb-2">No API keys configured</p>
                  <p className="text-gray-400 text-sm mb-6 max-w-sm mx-auto">
                    Add a Gemini or GitHub Models API key to use external AI for resume tailoring
                  </p>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 text-sm hover:bg-white/10 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add your first API key
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {apiKeys.map((key, index) => (
                    <motion.div
                      key={key.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center",
                            key.provider === 'GEMINI' 
                              ? "bg-gradient-to-br from-blue-500/20 to-cyan-500/20" 
                              : "bg-gradient-to-br from-green-500/20 to-emerald-500/20"
                          )}>
                            {key.provider === 'GEMINI' ? (
                              <Sparkles className="w-5 h-5 text-blue-400" />
                            ) : (
                              <Bot className="w-5 h-5 text-green-400" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-medium text-white">
                                {key.provider === 'GEMINI' ? 'Google Gemini' : 'GitHub Models'}
                              </h3>
                              {key.isValid ? (
                                <span className="flex items-center gap-1 px-2 py-0.5 text-xs bg-emerald-500/20 text-emerald-400 rounded-full">
                                  <CheckCircle className="w-3 h-3" />
                                  Valid
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 px-2 py-0.5 text-xs bg-red-500/20 text-red-400 rounded-full">
                                  <XCircle className="w-3 h-3" />
                                  Invalid
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500">
                              {key.provider === 'GEMINI' ? 'gemini-2.5-flash-lite' : 'openai/gpt-5'}
                            </p>
                            {key.endpoint && (
                              <div className="flex items-center gap-2 mt-2">
                                <code className="text-xs text-gray-400 bg-black/20 px-2 py-1 rounded">
                                  {key.endpoint}
                                </code>
                                <button
                                  onClick={() => copyToClipboard(key.endpoint!, key.id)}
                                  className="p-1 hover:bg-white/5 rounded transition-colors"
                                >
                                  {copiedId === key.id ? (
                                    <Check className="w-3 h-3 text-emerald-400" />
                                  ) : (
                                    <Copy className="w-3 h-3 text-gray-500" />
                                  )}
                                </button>
                              </div>
                            )}
                            {key.validationError && (
                              <p className="text-xs text-red-400 mt-2">⚠️ {key.validationError}</p>
                            )}
                            <p className="text-xs text-gray-500 mt-2">
                              Added {new Date(key.createdAt).toLocaleDateString()}
                              {key.lastValidated && ` • Last validated ${new Date(key.lastValidated).toLocaleDateString()}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleValidate(key.id)}
                            disabled={validating === key.id}
                            className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                            title="Re-validate"
                          >
                            <RefreshCw className={cn("w-4 h-4", validating === key.id && "animate-spin")} />
                          </button>
                          <button
                            onClick={() => handleDelete(key.id)}
                            className="p-2 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          {/* Security Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl bg-gray-900/50 backdrop-blur-sm border border-white/10 overflow-hidden"
          >
            <div className="p-6 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Security</h2>
                  <p className="text-sm text-gray-400">Privacy and data protection</p>
                </div>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                <div>
                  <p className="text-white font-medium">Data Encryption</p>
                  <p className="text-sm text-gray-400">All data is encrypted at rest and in transit</p>
                </div>
                <span className="px-3 py-1 text-xs bg-emerald-500/20 text-emerald-400 rounded-full">Active</span>
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                <div>
                  <p className="text-white font-medium">API Key Storage</p>
                  <p className="text-sm text-gray-400">Keys are securely stored and never exposed</p>
                </div>
                <span className="px-3 py-1 text-xs bg-emerald-500/20 text-emerald-400 rounded-full">Secure</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Add API Key Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-md rounded-2xl bg-gray-900 border border-white/10 shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-white/5">
                <h3 className="text-xl font-semibold text-white">Add AI Provider</h3>
                <p className="text-sm text-gray-400 mt-1">Configure an external AI model for resume tailoring</p>
              </div>
              
              <div className="p-6 space-y-4">
                {/* Provider Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Provider</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setProvider('GEMINI')}
                      className={cn(
                        "p-4 rounded-xl border transition-all text-left",
                        provider === 'GEMINI'
                          ? "bg-blue-500/10 border-blue-500/30 ring-2 ring-blue-500/20"
                          : "bg-white/5 border-white/10 hover:bg-white/10"
                      )}
                    >
                      <Sparkles className="w-5 h-5 text-blue-400 mb-2" />
                      <p className="text-white font-medium text-sm">Google Gemini</p>
                      <p className="text-xs text-gray-500 mt-1">gemini-2.5-flash-lite</p>
                    </button>
                    <button
                      onClick={() => setProvider('AZURE_OPENAI')}
                      className={cn(
                        "p-4 rounded-xl border transition-all text-left",
                        provider === 'AZURE_OPENAI'
                          ? "bg-green-500/10 border-green-500/30 ring-2 ring-green-500/20"
                          : "bg-white/5 border-white/10 hover:bg-white/10"
                      )}
                    >
                      <Bot className="w-5 h-5 text-green-400 mb-2" />
                      <p className="text-white font-medium text-sm">GitHub Models</p>
                      <p className="text-xs text-gray-500 mt-1">openai/gpt-5</p>
                    </button>
                  </div>
                </div>

                {/* API Key Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">API Key</label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={provider === 'GEMINI' ? 'Enter Gemini API key' : 'Enter GitHub token'}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
                  />
                  <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                    <ExternalLink className="w-3 h-3" />
                    {provider === 'GEMINI' 
                      ? 'Get key from Google AI Studio'
                      : 'Get token from GitHub Settings'}
                  </p>
                </div>

                {/* Endpoint (Azure only) */}
                {provider === 'AZURE_OPENAI' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Endpoint</label>
                    <input
                      type="text"
                      value={endpoint}
                      onChange={(e) => setEndpoint(e.target.value)}
                      placeholder="https://models.github.ai/inference"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
                    />
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-white/5 flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setApiKey('');
                    setEndpoint('https://models.github.ai/inference');
                  }}
                  disabled={saving}
                  className="px-4 py-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddApiKey}
                  disabled={saving || !apiKey.trim()}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium hover:from-blue-500 hover:to-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Validating...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Add Key
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
