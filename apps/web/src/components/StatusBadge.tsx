import React from 'react';
import { SourceChannel } from '../types';

export const ProduceStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  switch (status) {
    case 'SUBMITTED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-50 text-[#ed7423] border border-orange-200">
          <span className="w-1.5 h-1.5 rounded-full bg-[#ed7423]"></span> Submitted
        </span>
      );
    case 'AVAILABLE':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span> Ready / Available
        </span>
      );
    case 'COLLECTION_REQUESTED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Requested
        </span>
      );
    case 'COLLECTION_SCHEDULED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span> Scheduled
        </span>
      );
    case 'COLLECTED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-[#184037] border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-[#184037]"></span> Collected
        </span>
      );
    case 'PROCESSING':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> Processing
        </span>
      );
    case 'SOLD':
    case 'COMPLETED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-[#184037] border border-emerald-300">
          <span className="w-1.5 h-1.5 rounded-full bg-[#184037]"></span> Completed
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
          {status}
        </span>
      );
  }
};

export const ChannelBadge: React.FC<{ channel: SourceChannel }> = ({ channel }) => {
  switch (channel) {
    case 'WEB':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-[#184037] border border-emerald-200">
          🌐 Web PWA
        </span>
      );
    case 'USSD':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
          📟 USSD *XXX#
        </span>
      );
    case 'IVR':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-50 text-[#ed7423] border border-[#f6b787]">
          📞 IVR Voice
        </span>
      );
    case 'SMS':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
          💬 SMS
        </span>
      );
    default:
      return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-700">{channel}</span>;
  }
};

export const CollectionStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  switch (status) {
    case 'REQUESTED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-50 text-[#ed7423] border border-orange-200">
          ⏳ Requested
        </span>
      );
    case 'ACCEPTED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
          👍 FTMA Accepted
        </span>
      );
    case 'VEHICLE_ASSIGNED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
          🚚 Truck Assigned
        </span>
      );
    case 'ROUTE_PLANNED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
          🗺️ Route Planned
        </span>
      );
    case 'IN_PROGRESS':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          🔄 In Transit
        </span>
      );
    case 'COMPLETED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-[#184037] border border-emerald-200">
          ✅ Collected
        </span>
      );
    case 'CANCELLED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
          ❌ Cancelled
        </span>
      );
    default:
      return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs bg-slate-100 text-slate-700">{status}</span>;
  }
};
