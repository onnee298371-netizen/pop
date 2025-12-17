import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useAccount, useDisconnect, WagmiProvider } from 'wagmi';
import { base, baseSepolia } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createAppKit } from '@reown/appkit/react';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { Shield, Play, Square, Power, Loader2, Activity, Cpu } from 'lucide-react';

// --- CONFIGURATION ---
const PROJECT_ID = '9d932d4142e53fac5dd929e4c093f9c6';
const SUPABASE_URL = 'https://bskmkeshhpkqgcsvbifs.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJza21rZXNoaHBrcWdjc3ZiaWZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2MDAwOTIsImV4cCI6MjA4MTE3NjA5Mn0.0NPXeWGo71bF9UTVnOubgVVNXH0WJyzZFVzx_LV264A';

// Metadata for Reown (CRITICAL)
const metadata = {
  name: 'GCS Node Client',
  description: 'Desktop Node Mining Client',
  url: 'https://node-guardian-forge.lovable.app',
  icons: ['https://avatars.githubusercontent.com/u/37784886']
}

// Web3 Setup
const networks = [base, baseSepolia];
const wagmiAdapter = new WagmiAdapter({
  projectId: PROJECT_ID,
  networks,
  ssr: false
});

createAppKit({
  adapters: [wagmiAdapter],
  networks: networks,
  projectId: PROJECT_ID,
  metadata: metadata,
  features: {
    analytics: true,
    email: false,
    socials: []
  }
});

const queryClient = new QueryClient();
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function NodeClient() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  
  const [licenses, setLicenses] = useState([]);
  const [activeNodes, setActiveNodes] = useState({});
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState(["System ready. Connect wallet to start."]);
  const [sessionRewards, setSessionRewards] = useState(0.0);

  // --- LOGIC ---

  useEffect(() => {
    if (isConnected && address) {
      fetchLicenses(address);
    } else {
      setLicenses([]);
      setActiveNodes({});
    }
  }, [isConnected, address]);

  // Mining Loop (Ping every 5s)
  useEffect(() => {
    const interval = setInterval(() => {
      const activeKeys = Object.keys(activeNodes).filter(key => activeNodes[key]);
      if (activeKeys.length > 0) {
        activeKeys.forEach(key => sendPing(key));
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [activeNodes]);

  const addLog = (msg) => {
    const time = new Date().toLocaleTimeString().split(' ')[0];
    setLogs(prev => [`[${time}] ${msg}`, ...prev].slice(0, 6));
  };

  const fetchLicenses = async (wallet) => {
    setLoading(true);
    addLog(`Scanning licenses for ${wallet.slice(0,6)}...`);
    try {
      const { data, error } = await supabase.functions.invoke('get-wallet-licenses', {
        headers: { "x-wallet-address": wallet }
      });

      if (error) throw error;

      if (data?.licenses) {
        setLicenses(data.licenses);
        addLog(`Successfully loaded ${data.licenses.length} licenses.`);
      } else {
        addLog("No licenses found.");
      }
    } catch (e) {
      console.error(e);
      addLog("Error connecting to GCS Core.");
      // MOCK DATA for Demo (Delete in Prod)
      setLicenses([
        { key: "GCS-TIER1-DEMO-AA01", tier: "Tier 1" },
        { key: "GCS-TIER2-DEMO-BB02", tier: "Tier 2" }
      ]);
    }
    setLoading(false);
  };

  const sendPing = async (key) => {
    try {
      // Mock local update for UI smoothness
      setSessionRewards(prev => prev + 0.005);
      
      const { data, error } = await supabase.functions.invoke('node-ping', {
        body: {
          license_key: key,
          device_id: "desktop-" + address,
          uptime_minutes: 1,
          version: "2.0.0"
        }
      });
      
      if (error) throw error;
    } catch (e) {
      // Silent fail or log
    }
  };

  const toggleNode = (key) => {
    setActiveNodes(prev => {
      const newState = !prev[key];
      addLog(newState ? `Node ${key.slice(-4)} STARTED.` : `Node ${key.slice(-4)} STOPPED.`);
      return { ...prev, [key]: newState };
    });
  };

  const toggleAll = (state) => {
    const newState = {};
    licenses.forEach(l => newState[l.key] = state);
    setActiveNodes(newState);
    addLog(state ? "All nodes started." : "All nodes stopped.");
  };

  // --- RENDER ---

  if (!isConnected) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-background text-white p-6">
        <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-8 border border-primary/30 shadow-[0_0_50px_rgba(0,243,255,0.2)] animate-pulse">
          <Shield className="w-12 h-12 text-primary" />
        </div>
        <h1 className="text-3xl font-bold mb-2 tracking-widest">GCS NODE</h1>
        <p className="text-gray-500 mb-10 text-sm font-mono">SECURE • DECENTRALIZED • FAST</p>
        <appkit-button />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background text-white overflow-hidden border border-white/5">
      {/* Header */}
      <div className="h-16 bg-[#0a0a15] border-b border-white/5 flex items-center justify-between px-5 select-none">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          <span className="font-bold text-sm tracking-widest text-gray-300">GCS CLIENT v2.0</span>
        </div>
        <button onClick={() => disconnect()} className="p-2 hover:bg-white/5 rounded-lg transition group">
          <Power size={16} className="text-danger group-hover:text-red-400" />
        </button>
      </div>

      {/* Stats */}
      <div className="p-5 grid grid-cols-2 gap-4">
        <div className="bg-[#11111a] border border-white/5 rounded-xl p-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 opacity-10"><Activity /></div>
          <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Active Nodes</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{Object.values(activeNodes).filter(Boolean).length}</span>
            <span className="text-xs text-gray-600">/ {licenses.length}</span>
          </div>
        </div>
        <div className="bg-[#11111a] border border-white/5 rounded-xl p-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 opacity-10"><Cpu /></div>
          <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Session Rewards</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-primary font-mono">{sessionRewards.toFixed(4)}</span>
            <span className="text-xs text-primary/50">GCS</span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="px-5 mb-2 flex gap-3">
        <button onClick={() => toggleAll(true)} className="flex-1 bg-primary/10 border border-primary/30 text-primary text-xs font-bold py-3 rounded-lg hover:bg-primary/20 transition">
          START ALL
        </button>
        <button onClick={() => toggleAll(false)} className="flex-1 bg-danger/10 border border-danger/30 text-danger text-xs font-bold py-3 rounded-lg hover:bg-danger/20 transition">
          STOP ALL
        </button>
      </div>

      {/* License List */}
      <div className="flex-1 overflow-y-auto px-5 space-y-3 pb-4 custom-scrollbar">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-2">
            <Loader2 className="animate-spin text-primary" />
            <span className="text-xs">Fetching Licenses...</span>
          </div>
        ) : licenses.length === 0 ? (
          <div className="text-center text-gray-600 text-xs mt-10">
            No licenses found.<br/>Please purchase a node to start mining.
          </div>
        ) : (
          licenses.map((lic) => (
            <div key={lic.key} className="bg-[#11111a] border border-white/5 p-4 rounded-xl flex items-center justify-between group hover:border-primary/20 transition">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono text-gray-300 tracking-tight">..{lic.key.slice(-6)}</span>
                  <span className="text-[9px] bg-[#222] px-2 py-0.5 rounded text-gray-400 font-bold border border-white/5">{lic.tier}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${activeNodes[lic.key] ? 'bg-success animate-pulse shadow-[0_0_8px_#00ff9d]' : 'bg-[#333]'}`}></div>
                  <span className={`text-[10px] font-bold ${activeNodes[lic.key] ? 'text-success' : 'text-gray-600'}`}>
                    {activeNodes[lic.key] ? 'MINING' : 'IDLE'}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => toggleNode(lic.key)}
                className={`w-10 h-10 rounded-lg flex items-center justify-center transition ${
                  activeNodes[lic.key] 
                  ? 'bg-danger/10 text-danger hover:bg-danger/20' 
                  : 'bg-primary/10 text-primary hover:bg-primary/20'
                }`}
              >
                {activeNodes[lic.key] ? <Square size={14} fill="currentColor"/> : <Play size={14} fill="currentColor"/>}
              </button>
            </div>
          ))
        )}
      </div>

      {/* Logs */}
      <div className="h-24 bg-black border-t border-white/10 p-3 font-mono text-[10px] text-gray-500 overflow-hidden">
        {logs.map((log, i) => (
          <div key={i} className="truncate opacity-70 hover:opacity-100 mb-1">> {log}</div>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <NodeClient />
      </QueryClientProvider>
    </WagmiProvider>
  );
}