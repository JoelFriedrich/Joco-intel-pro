import React, { useState } from 'react';
import { User, CreditCard, Shield, Filter, Trash2, ExternalLink, Mail, MapPin, Calendar, CheckCircle2, ArrowLeft, Save } from 'lucide-react';
import { UserPlan, SavedFilter } from '../types';
import { cn } from '../lib/utils';

interface SettingsProps {
  userPlan: UserPlan;
  setUserPlan: (plan: UserPlan) => void;
  userProfile: {
    name: string;
    email: string;
    location: string;
    memberSince: string;
  };
  setUserProfile: (profile: any) => void;
  savedFilters: SavedFilter[];
  onDeleteFilter: (id: string) => void;
  onApplyFilter: (filters: any) => void;
  onBack: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ 
  userPlan, 
  setUserPlan, 
  userProfile,
  setUserProfile,
  savedFilters, 
  onDeleteFilter,
  onApplyFilter,
  onBack
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(userProfile);

  const handleSaveProfile = () => {
    setUserProfile(editForm);
    setIsEditing(false);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-dark-bg p-8">
      <div className="max-w-4xl mx-auto space-y-12">
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors group"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-bold uppercase tracking-widest">Back to Terminal</span>
          </button>
        </div>

        {/* Account Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
              <User className="text-accent-amber" size={24} />
              Account Information
            </h2>
            {!isEditing ? (
              <button 
                onClick={() => setIsEditing(true)}
                className="text-xs font-bold text-accent-amber hover:underline"
              >
                Edit Profile
              </button>
            ) : (
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setIsEditing(false)}
                  className="text-xs font-bold text-gray-500 hover:text-gray-300"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveProfile}
                  className="flex items-center gap-2 bg-accent-amber text-black px-3 py-1 rounded-lg text-xs font-bold hover:bg-accent-amber/90"
                >
                  <Save size={14} />
                  Save Changes
                </button>
              </div>
            )}
          </div>
          <div className="bg-[#16191d] border border-gray-800 rounded-2xl p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div>
                <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest block mb-1">Full Name</label>
                {isEditing ? (
                  <input 
                    type="text"
                    className="w-full bg-black/40 border border-gray-700 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-accent-amber"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  />
                ) : (
                  <p className="text-white font-bold">{userProfile.name}</p>
                )}
              </div>
              <div>
                <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest block mb-1">Email Address</label>
                {isEditing ? (
                  <input 
                    type="email"
                    className="w-full bg-black/40 border border-gray-700 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-accent-amber"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  />
                ) : (
                  <div className="flex items-center gap-2 text-gray-300">
                    <Mail size={14} className="text-gray-500" />
                    {userProfile.email}
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest block mb-1">Location</label>
                <div className="flex items-center gap-2 text-gray-300">
                  <MapPin size={14} className="text-gray-500" />
                  {userProfile.location}
                </div>
              </div>
              <div>
                <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest block mb-1">Member Since</label>
                <div className="flex items-center gap-2 text-gray-300">
                  <Calendar size={14} className="text-gray-500" />
                  {userProfile.memberSince}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Subscription Section */}
        <section>
          <h2 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-3 mb-6">
            <Shield className="text-accent-amber" size={24} />
            Plan & Billing
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(['Free', 'Pro', 'Enterprise'] as UserPlan[]).map((plan) => (
              <div 
                key={plan}
                className={cn(
                  "bg-[#16191d] border rounded-2xl p-6 transition-all cursor-pointer relative overflow-hidden",
                  userPlan === plan ? "border-accent-amber ring-1 ring-accent-amber" : "border-gray-800 hover:border-gray-700"
                )}
                onClick={() => setUserPlan(plan)}
              >
                {userPlan === plan && (
                  <div className="absolute top-0 right-0 bg-accent-amber text-black text-[10px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-widest">
                    Current
                  </div>
                )}
                <h3 className="text-lg font-black text-white mb-1">{plan}</h3>
                <p className="text-xs text-gray-500 mb-4">
                  {plan === 'Free' && "Basic research tools for individuals."}
                  {plan === 'Pro' && "Advanced analytics and CSV exports."}
                  {plan === 'Enterprise' && "Full database access and team tools."}
                </p>
                <div className="text-2xl font-black text-white mb-6">
                  {plan === 'Free' && "$0"}
                  {plan === 'Pro' && "$49"}
                  {plan === 'Enterprise' && "$199"}
                  <span className="text-xs text-gray-500 font-normal ml-1">/mo</span>
                </div>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center gap-2 text-[10px] text-gray-400">
                    <CheckCircle2 size={12} className="text-positive-green" />
                    Property Search
                  </li>
                  <li className="flex items-center gap-2 text-[10px] text-gray-400">
                    <CheckCircle2 size={12} className={plan !== 'Free' ? "text-positive-green" : "text-gray-600"} />
                    CSV Export {plan === 'Free' && "(Pro)"}
                  </li>
                  <li className="flex items-center gap-2 text-[10px] text-gray-400">
                    <CheckCircle2 size={12} className={plan === 'Enterprise' ? "text-positive-green" : "text-gray-600"} />
                    API Access {plan !== 'Enterprise' && "(Ent)"}
                  </li>
                </ul>
              </div>
            ))}
          </div>
          
          <div className="mt-6 bg-[#16191d] border border-gray-800 rounded-2xl p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center">
                <CreditCard className="text-gray-400" size={24} />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Visa ending in 4242</p>
                <p className="text-xs text-gray-500">Next billing date: April 26, 2026</p>
              </div>
            </div>
            <button className="text-xs font-bold text-accent-amber hover:underline">Update Payment Method</button>
          </div>
        </section>

        {/* Saved Filters Section */}
        <section>
          <h2 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-3 mb-6">
            <Filter className="text-accent-amber" size={24} />
            Saved Filters
          </h2>
          <div className="bg-[#16191d] border border-gray-800 rounded-2xl overflow-hidden">
            {savedFilters.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-gray-500 text-sm">No saved filters yet.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="px-6 py-4 text-[10px] uppercase font-black text-gray-500 tracking-widest">Filter Name</th>
                    <th className="px-6 py-4 text-[10px] uppercase font-black text-gray-500 tracking-widest">Created</th>
                    <th className="px-6 py-4 text-[10px] uppercase font-black text-gray-500 tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50">
                  {savedFilters.map((filter) => (
                    <tr key={filter.id} className="hover:bg-white/5 transition-colors group">
                      <td className="px-6 py-4">
                        <span className="text-sm font-bold text-white">{filter.name}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-gray-500">{new Date(filter.createdAt).toLocaleDateString()}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => onApplyFilter(filter.filters)}
                            className="p-2 hover:bg-accent-amber/10 rounded-lg text-gray-500 hover:text-accent-amber transition-all"
                            title="Apply Filter"
                          >
                            <ExternalLink size={16} />
                          </button>
                          <button 
                            onClick={() => onDeleteFilter(filter.id)}
                            className="p-2 hover:bg-distress-red/10 rounded-lg text-gray-500 hover:text-distress-red transition-all"
                            title="Delete Filter"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
