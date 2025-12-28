import { UserButton } from "@clerk/nextjs";

/**
 * Dashboard Page (/dashboard)
 * 
 * Purpose (from userflow.md):
 * - Show all Resume Projects
 * - Entry point after login
 * 
 * Visible Elements:
 * - List of Resume Projects (name, last updated, number of versions)
 * - "Create New Resume Project" button
 * 
 * Allowed Actions:
 * - Create new project
 * - Open existing project
 * - Delete project (optional later)
 * 
 * Disallowed:
 * - Resume editing (happens in separate editor page)
 * - AI actions (triggered from editor)
 * 
 * PHASE 1: SCAFFOLDING ONLY
 * - No API calls
 * - No business logic
 * - Placeholder UI only
 */
export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-900">Resume Projects</h1>
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Create New Project Button */}
        <div className="mb-6">
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition">
            Create New Resume Project
          </button>
        </div>

        {/* TODO: API call to fetch resume projects */}
        {/* TODO: Display list of resume projects with name, last updated, version count */}
        {/* TODO: Click handler to open existing project */}
        {/* TODO: Delete project action (optional later) */}

        {/* Placeholder Project List */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 text-center text-gray-500">
            <p>No resume projects yet.</p>
            <p className="text-sm mt-2">Click "Create New Resume Project" to get started.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
