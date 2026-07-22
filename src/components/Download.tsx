import { Download as DownloadIcon, Windows, Apple, Linux } from 'lucide-react';

const downloads = [
  {
    platform: 'Windows',
    icon: Windows,
    file: 'CraftLauncher_Setup.exe',
    size: '45MB',
    color: 'from-blue-500 to-blue-600',
  },
  {
    platform: 'macOS',
    icon: Apple,
    file: 'CraftLauncher.dmg',
    size: '52MB',
    color: 'from-gray-400 to-gray-500',
  },
  {
    platform: 'Linux',
    icon: Linux,
    file: 'CraftLauncher.AppImage',
    size: '48MB',
    color: 'from-green-500 to-green-600',
  },
];

export function Download() {
  return (
    <section id="download" className="py-24 bg-gradient-to-b from-[#0a0a0f] to-[#1a1a2e]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-green-500/20 text-green-400 text-sm font-medium mb-4">
            免费下载
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            获取 Craft Launcher
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            选择适合你的平台，开始你的 Minecraft 冒险之旅
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {downloads.map((item) => (
            <div
              key={item.platform}
              className="group relative p-8 rounded-2xl bg-gradient-to-br from-[#16213e] to-[#0f3460] hover:from-[#233a5c] hover:to-[#1a4a7a] transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-[#4b3fe3]/20 border border-white/5 hover:border-[#4b3fe3]/30"
            >
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-6 mx-auto shadow-lg shadow-black/20 group-hover:scale-110 transition-transform`}>
                <item.icon className="w-8 h-8 text-white" />
              </div>
              
              <h3 className="text-xl font-semibold text-white text-center mb-2">
                {item.platform}
              </h3>
              
              <p className="text-gray-400 text-center text-sm mb-6">
                {item.file} · {item.size}
              </p>
              
              <button className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#4b3fe3] text-white font-medium hover:bg-[#6a6fff] transition-all hover:scale-105 shadow-lg shadow-[#4b3fe3]/30">
                <DownloadIcon className="w-4 h-4" />
                下载
              </button>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-500 text-sm">
            当前版本: v2.4.1 | 更新时间: 2026年7月10日
          </p>
        </div>
      </div>
    </section>
  );
}