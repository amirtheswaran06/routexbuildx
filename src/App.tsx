import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AerovisProvider, useAerovis } from './context/AerovisContext';
import { Shell } from './components/layout/Shell';

// Modules
import { OverviewModule } from './components/modules/overview/OverviewModule';
import { LiveMonitoringModule } from './components/modules/live-monitoring/LiveMonitoringModule';
import { CameraNetworkModule } from './components/modules/camera-network/CameraNetworkModule';
import { AiDetectionModule } from './components/modules/ai-detection/AiDetectionModule';
import { VehicleIntelligenceModule } from './components/modules/vehicle-intelligence/VehicleIntelligenceModule';
import { PersonIntelligenceModule } from './components/modules/person-intelligence/PersonIntelligenceModule';
import { MissingPersonsModule } from './components/modules/missing-persons/MissingPersonsModule';
import { TrafficAnalyticsModule } from './components/modules/traffic-analytics/TrafficAnalyticsModule';
import { IncidentManagementModule } from './components/modules/incident-management/IncidentManagementModule';
import { InvestigationCentreModule } from './components/modules/investigation-centre/InvestigationCentreModule';
import { BusNetworkModule } from './components/modules/bus-network/BusNetworkModule';
import { ReportsModule } from './components/modules/reports/ReportsModule';
import { AdministrationModule } from './components/modules/administration/AdministrationModule';
import { SettingsModule } from './components/modules/settings/SettingsModule';
import { Lock, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './components/common/Button';

const ModuleDispatcher: React.FC = () => {
  const { activeModule, isLoading, errorMessage, reloadData } = useAerovis();
  const { canAccessModule, currentUser } = useAuth();

  if (!canAccessModule(activeModule)) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center bg-white rounded-xl border border-slate-200">
        <div className="p-3 bg-rose-50 text-rose-600 rounded-full mb-3">
          <Lock className="w-8 h-8" />
        </div>
        <h3 className="text-base font-bold text-slate-900">
          Access Restricted: {activeModule.replace(/-/g, ' ').toUpperCase()}
        </h3>
        <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4">
          Your current security clearance ({currentUser.role.replace(/_/g, ' ')}) does not authorize access to this municipal visual intelligence workspace.
        </p>
        <div className="text-[11px] font-mono bg-slate-50 border border-slate-200 px-3 py-1.5 rounded text-slate-600">
          REQUIRED PERMISSION: SUPER_ADMIN OR ASSIGNED BUREAU CLEARANCE
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col relative">
      {/* Non-intrusive Top Loading Indicator Bar */}
      {isLoading && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-blue-100 overflow-hidden z-50">
          <div className="h-full bg-blue-600 animate-pulse w-full" />
        </div>
      )}

      {/* Error State Banner with Retry */}
      {errorMessage && (
        <div className="mb-2 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex items-center justify-between shadow-2xs shrink-0">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>Database Query Notice: {errorMessage}</span>
          </div>
          <Button
            variant="outline"
            size="xs"
            onClick={() => reloadData()}
            icon={<RefreshCw className="w-3 h-3" />}
          >
            Retry Connection
          </Button>
        </div>
      )}

      {/* Module Content */}
      <div className="flex-1 min-h-0">
        {(() => {
          switch (activeModule) {
            case 'overview':
              return <OverviewModule />;
            case 'live-monitoring':
              return <LiveMonitoringModule />;
            case 'camera-network':
              return <CameraNetworkModule />;
            case 'ai-detection':
              return <AiDetectionModule />;
            case 'vehicle-intelligence':
              return <VehicleIntelligenceModule />;
            case 'person-intelligence':
              return <PersonIntelligenceModule />;
            case 'missing-persons':
              return <MissingPersonsModule />;
            case 'traffic-analytics':
              return <TrafficAnalyticsModule />;
            case 'incident-management':
              return <IncidentManagementModule />;
            case 'investigation-centre':
              return <InvestigationCentreModule />;
            case 'bus-network':
              return <BusNetworkModule />;
            case 'reports':
              return <ReportsModule />;
            case 'administration':
              return <AdministrationModule />;
            case 'settings':
              return <SettingsModule />;
            default:
              return <OverviewModule />;
          }
        })()}
      </div>
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <AerovisProvider>
        <Shell>
          <ModuleDispatcher />
        </Shell>
      </AerovisProvider>
    </AuthProvider>
  );
}

export default App;
