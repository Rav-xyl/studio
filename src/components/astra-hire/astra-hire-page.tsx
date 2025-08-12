'use client';

import { useState } from 'react';
import { BarChart2, Briefcase, Users } from 'lucide-react';
import { AstraHireHeader } from './astra-hire-header';
import { CandidatePoolTab } from '../kanban/candidate-pool-tab';
import { RolesTab } from '../roles/roles-tab';
import { AnalyticsTab } from '../analytics/analytics-tab';

export function AstraHirePage() {
  const [activeTab, setActiveTab] = useState('pool');

  const renderActiveTabView = () => {
    switch (activeTab) {
      case 'roles':
        return <RolesTab />;
      case 'pool':
        return <CandidatePoolTab />;
      case 'analytics':
        return <AnalyticsTab />;
      default:
        return null;
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <AstraHireHeader />
      <main>
        <div className="border-b border-slate-700 mb-6">
          <nav className="flex -mb-px">
            <button
              className={`tab-btn ${activeTab === 'roles' ? 'active' : ''}`}
              onClick={() => setActiveTab('roles')}
            >
              <Briefcase className="inline-block w-4 h-4 mr-2" />
              Client Roles
            </button>
            <button
              className={`tab-btn ${activeTab === 'pool' ? 'active' : ''}`}
              onClick={() => setActiveTab('pool')}
            >
              <Users className="inline-block w-4 h-4 mr-2" />
              Candidate Pool
            </button>
            <button
              className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
              onClick={() => setActiveTab('analytics')}
            >
              <BarChart2 className="inline-block w-4 h-4 mr-2" />
              Analytics
            </button>
          </nav>
        </div>
        <div id="tab-content">{renderActiveTabView()}</div>
      </main>
    </div>
  );
}
