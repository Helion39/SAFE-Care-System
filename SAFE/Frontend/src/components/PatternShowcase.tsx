import React from 'react';
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Info, 
  Users, 
  Heart,
  Shield,
  TrendingUp
} from 'lucide-react';

export function PatternShowcase() {
  return (
    <div className="page-container">
      <div className="main-container">
        <h1 className="text-2xl font-bold text-gray-800 mb-8">
          SAFE Pastel Design Pattern Showcase
        </h1>

        {/* Card Patterns */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-gray-700 mb-6">Card Patterns</h2>
          <div className="grid-3-responsive">
            <div className="card-base">
              <div className="card-header-base">
                <Users className="w-5 h-5 text-info" />
                Base Card
              </div>
              <p className="text-sm text-gray-600">
                Standard card with header and content area. Perfect for most use cases.
              </p>
            </div>
            
            <div className="card-compact">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Compact Card</h3>
              <p className="text-sm text-gray-600">
                Reduced padding for dense layouts and smaller content areas.
              </p>
            </div>
            
            <div className="metric-card-base">
              <div className="metric-icon-base">
                <Heart className="w-6 h-6 text-info" />
              </div>
              <div className="metric-number-base">42</div>
              <div className="metric-label-base">Active Residents</div>
            </div>
          </div>
        </section>

        {/* Button Patterns */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-gray-700 mb-6">Button Patterns</h2>
          <div className="card-base">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Primary & Secondary</h3>
                <div className="flex flex-wrap gap-3">
                  <button className="btn-primary-pastel">
                    <Users className="w-4 h-4" />
                    Primary Button
                  </button>
                  <button className="btn-secondary-pastel">
                    Secondary Button
                  </button>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Status Buttons</h3>
                <div className="flex flex-wrap gap-3">
                  <button className="btn-success-pastel">Success</button>
                  <button className="btn-warning-pastel">Warning</button>
                  <button className="btn-error-pastel">Error</button>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Button Sizes</h3>
                <div className="flex flex-wrap items-center gap-3">
                  <button className="btn-primary-pastel btn-sm-pastel">Small</button>
                  <button className="btn-primary-pastel">Default</button>
                  <button className="btn-primary-pastel btn-lg-pastel">Large</button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Form Patterns */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-gray-700 mb-6">Form Patterns</h2>
          <div className="grid-2-responsive">
            <div className="card-base">
              <h3 className="text-sm font-medium text-gray-700 mb-4">Standard Form</h3>
              <div className="form-group-base">
                <label className="label-base">Patient Name</label>
                <input 
                  className="input-base input-focus" 
                  placeholder="Enter patient name..."
                  defaultValue="John Doe"
                />
              </div>
              <div className="form-group-base">
                <label className="label-base">Room Number</label>
                <input 
                  className="input-base input-focus" 
                  placeholder="Enter room number..."
                  defaultValue="204"
                />
              </div>
            </div>
            
            <div className="card-base">
              <h3 className="text-sm font-medium text-gray-700 mb-4">Form with Error</h3>
              <div className="form-group-base">
                <label className="label-base">Blood Pressure</label>
                <input 
                  className="input-base input-error" 
                  placeholder="Enter BP reading..."
                  defaultValue="invalid"
                />
                <p className="text-xs text-error mt-1">Please enter a valid blood pressure reading</p>
              </div>
              <div className="form-group-base">
                <label className="label-base">Heart Rate</label>
                <input 
                  className="input-base input-focus" 
                  placeholder="Enter heart rate..."
                  defaultValue="72"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Badge and Alert Patterns */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-gray-700 mb-6">Badges & Alerts</h2>
          <div className="grid-2-responsive">
            <div className="card-base">
              <h3 className="text-sm font-medium text-gray-700 mb-4">Badge Patterns</h3>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="badge-primary-pastel">Primary</span>
                <span className="badge-success-pastel">Success</span>
                <span className="badge-warning-pastel">Warning</span>
                <span className="badge-error-pastel">Error</span>
                <span className="badge-secondary-pastel">Secondary</span>
              </div>
              
              <h4 className="text-xs font-medium text-gray-600 mb-2">Healthcare Status</h4>
              <div className="flex flex-wrap gap-2">
                <span className="badge-base vitals-normal">Normal</span>
                <span className="badge-base vitals-warning">Warning</span>
                <span className="badge-base vitals-critical">Critical</span>
              </div>
            </div>
            
            <div className="card-base">
              <h3 className="text-sm font-medium text-gray-700 mb-4">Alert Patterns</h3>
              <div className="space-y-3">
                <div className="alert-success-pastel">
                  <CheckCircle className="w-4 h-4 inline mr-2" />
                  Vitals recorded successfully
                </div>
                
                <div className="alert-warning-pastel">
                  <AlertTriangle className="w-4 h-4 inline mr-2" />
                  Blood pressure slightly elevated
                </div>
                
                <div className="alert-error-pastel">
                  <XCircle className="w-4 h-4 inline mr-2" />
                  Emergency alert: Fall detected
                </div>
                
                <div className="alert-info-pastel">
                  <Info className="w-4 h-4 inline mr-2" />
                  Medication reminder due in 30 minutes
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Table Pattern */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-gray-700 mb-6">Table Pattern</h2>
          <div className="table-container">
            <table className="table-base">
              <thead>
                <tr>
                  <th className="table-header">Patient</th>
                  <th className="table-header">Room</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Last Check</th>
                </tr>
              </thead>
              <tbody>
                <tr className="table-row-hover">
                  <td className="table-cell">John Doe</td>
                  <td className="table-cell">204</td>
                  <td className="table-cell">
                    <span className="badge-success-pastel">Stable</span>
                  </td>
                  <td className="table-cell">2 hours ago</td>
                </tr>
                <tr className="table-row-hover">
                  <td className="table-cell">Jane Smith</td>
                  <td className="table-cell">205</td>
                  <td className="table-cell">
                    <span className="badge-warning-pastel">Monitoring</span>
                  </td>
                  <td className="table-cell">30 minutes ago</td>
                </tr>
                <tr className="table-row-hover">
                  <td className="table-cell">Bob Johnson</td>
                  <td className="table-cell">206</td>
                  <td className="table-cell">
                    <span className="badge-error-pastel">Alert</span>
                  </td>
                  <td className="table-cell">5 minutes ago</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Metric Cards Grid */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-gray-700 mb-6">Metric Cards Grid</h2>
          <div className="grid-responsive">
            <div className="metric-card-base hover-lift">
              <div className="metric-icon-base">
                <AlertTriangle className="w-6 h-6 text-error" />
              </div>
              <div className="metric-number-base text-error">3</div>
              <div className="metric-label-base">Active Alerts</div>
            </div>
            
            <div className="metric-card-base hover-lift">
              <div className="metric-icon-base">
                <Users className="w-6 h-6 text-info" />
              </div>
              <div className="metric-number-base">45</div>
              <div className="metric-label-base">Total Residents</div>
            </div>
            
            <div className="metric-card-base hover-lift">
              <div className="metric-icon-base">
                <Shield className="w-6 h-6 text-info" />
              </div>
              <div className="metric-number-base">12</div>
              <div className="metric-label-base">Active Caregivers</div>
            </div>
            
            <div className="metric-card-base hover-lift">
              <div className="metric-icon-base">
                <TrendingUp className="w-6 h-6 text-info" />
              </div>
              <div className="metric-number-base">8</div>
              <div className="metric-label-base">Resolved Today</div>
            </div>
          </div>
        </section>

        {/* Animation Examples */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-gray-700 mb-6">Animation Examples</h2>
          <div className="grid-3-responsive">
            <div className="card-base animate-fade-in">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Fade In</h3>
              <p className="text-sm text-gray-600">This card fades in smoothly</p>
            </div>
            
            <div className="card-base animate-slide-up">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Slide Up</h3>
              <p className="text-sm text-gray-600">This card slides up from below</p>
            </div>
            
            <div className="card-base hover-lift click-scale">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Interactive</h3>
              <p className="text-sm text-gray-600">Hover to lift, click to scale</p>
            </div>
          </div>
        </section>

        {/* Emergency Alert Example */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-gray-700 mb-6">Emergency Alert (Fixed Position)</h2>
          <div className="card-base">
            <p className="text-sm text-gray-600 mb-4">
              The emergency alert below demonstrates the fixed positioning pattern used for urgent notifications.
            </p>
            <div className="relative">
              <div className="bg-error-light border border-error/20 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-error/10 rounded-lg flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5 text-error" />
                    </div>
                    <div>
                      <div className="font-medium text-error">Emergency Alert</div>
                      <div className="text-sm text-gray-600">Fall detected - Room 204 - Mary Johnson</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="btn-error-pastel btn-sm-pastel">Claim</button>
                    <button className="btn-secondary-pastel btn-sm-pastel">Details</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}