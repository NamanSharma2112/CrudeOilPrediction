import SideBar from "./compoents/sidebar/SideBar";


export default function Home() {
  return (
    <div className="flex h-screen bg-gray-100">
      <SideBar/>
      <div className="w-64 bg-gray-900 text-white shrink-0">
        Sidebar
      </div>
      <div className="flex flex-col flex-1 overflow-hidden">
        TOPBAR
        <div className="h-16 bg-white border-b border-gray-200 flex items-center px-6">
          Topbar
        </div>
       <main className="flex-1 overfolw-y-auto p-6">
        <div className="h-96 bg-white rounded-xl border border-gray-200">
          Main content area
        </div>
       </main>

      </div>
      
    </div>
  );
}
