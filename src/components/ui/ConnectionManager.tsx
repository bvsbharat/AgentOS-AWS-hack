import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Github, Twitter, CheckCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { composioService } from '@/services/composioService';

interface ConnectionStatus {
  github: 'connected' | 'disconnected' | 'connecting';
  twitter: 'connected' | 'disconnected' | 'connecting';
}

interface ConnectionManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ConnectionManager({ isOpen, onClose }: ConnectionManagerProps) {
  const [connections, setConnections] = useState<ConnectionStatus>({
    github: 'disconnected',
    twitter: 'disconnected'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      checkConnections();
    }
  }, [isOpen]);

  const checkConnections = async () => {
    try {
      const apps = await composioService.getConnectedApps();
      const newConnections = { ...connections };
      
      apps.forEach((app: any) => {
        if (app.appName?.toLowerCase().includes('github')) {
          newConnections.github = app.status === 'active' ? 'connected' : 'disconnected';
        }
        if (app.appName?.toLowerCase().includes('twitter') || app.appName?.toLowerCase().includes('x')) {
          newConnections.twitter = app.status === 'active' ? 'connected' : 'disconnected';
        }
      });
      
      setConnections(newConnections);
    } catch (err) {
      console.error('Failed to check connections:', err);
    }
  };

  const connectApp = async (app: 'github' | 'twitter') => {
    setIsLoading(true);
    setError(null);
    setConnections(prev => ({ ...prev, [app]: 'connecting' }));

    try {
      const result = await composioService.initiateConnection(app);
      
      if (result?.redirectUrl) {
        const width = 600;
        const height = 700;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;
        
        window.open(
          result.redirectUrl,
          `${app}-auth`,
          `width=${width},height=${height},left=${left},top=${top}`
        );

        const checkInterval = setInterval(async () => {
          const status = await composioService.checkConnectionStatus(result.connectionId);
          if (status?.status === 'active') {
            clearInterval(checkInterval);
            setConnections(prev => ({ ...prev, [app]: 'connected' }));
            setIsLoading(false);
          }
        }, 3000);

        setTimeout(() => {
          clearInterval(checkInterval);
          if (connections[app] === 'connecting') {
            setConnections(prev => ({ ...prev, [app]: 'disconnected' }));
            setIsLoading(false);
          }
        }, 120000);
      } else {
        setConnections(prev => ({ ...prev, [app]: 'disconnected' }));
        setError('Failed to initiate connection. API may be unavailable.');
        setIsLoading(false);
      }
    } catch (err: any) {
      console.error(`Failed to connect ${app}:`, err);
      setError(err.message || 'Connection failed');
      setConnections(prev => ({ ...prev, [app]: 'disconnected' }));
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Connect Integrations</h2>
                <p className="text-sm text-slate-400">Link your accounts to enable automation</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-slate-400 hover:text-white hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Connections List */}
          <div className="p-6 space-y-4">
            {/* GitHub */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Github className="w-6 h-6" />
                  <div>
                    <h3 className="font-medium text-white">GitHub</h3>
                    <p className="text-xs text-slate-400">Create repos, issues, push code</p>
                  </div>
                </div>
                <ConnectionButton
                  status={connections.github}
                  onConnect={() => connectApp('github')}
                  isLoading={isLoading}
                />
              </div>
            </div>

            {/* Twitter/X */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Twitter className="w-6 h-6" />
                  <div>
                    <h3 className="font-medium text-white">X (Twitter)</h3>
                    <p className="text-xs text-slate-400">Post tweets, schedule content</p>
                  </div>
                </div>
                <ConnectionButton
                  status={connections.twitter}
                  onConnect={() => connectApp('twitter')}
                  isLoading={isLoading}
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                <p className="text-xs text-red-400">{error}</p>
              </div>
            )}

            {/* Info */}
            <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
              <p className="text-xs text-cyan-400">
                💡 Click connect to authorize AgentOS to access your accounts. 
                You&apos;ll be redirected to authorize the app.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-white/10">
            <Button
              onClick={checkConnections}
              variant="outline"
              className="w-full bg-white/5 border-white/10 text-white hover:bg-white/10"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Status
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function ConnectionButton({ 
  status, 
  onConnect, 
  isLoading 
}: { 
  status: 'connected' | 'disconnected' | 'connecting';
  onConnect: () => void;
  isLoading: boolean;
}) {
  if (status === 'connected') {
    return (
      <div className="flex items-center gap-2 text-green-400">
        <CheckCircle className="w-5 h-5" />
        <span className="text-sm font-medium">Connected</span>
      </div>
    );
  }

  if (status === 'connecting') {
    return (
      <Button disabled size="sm" className="bg-cyan-500/50">
        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
        Connecting...
      </Button>
    );
  }

  return (
    <Button 
      onClick={onConnect} 
      disabled={isLoading}
      size="sm"
      className="bg-cyan-500 hover:bg-cyan-600"
    >
      Connect
    </Button>
  );
}
