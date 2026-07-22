import { Github, Twitter, MessageCircle } from 'lucide-react';

const links = {
  product: [
    { label: '下载', href: '#download' },
    { label: '特性', href: '#features' },
    { label: '更新日志', href: '#changelog' },
    { label: '文档', href: '#docs' },
  ],
  resources: [
    { label: 'GitHub', href: '#' },
    { label: 'Discord', href: '#' },
    { label: 'Wiki', href: '#' },
    { label: 'API', href: '#' },
  ],
  support: [
    { label: '帮助中心', href: '#' },
    { label: '反馈问题', href: '#' },
    { label: '联系我们', href: '#' },
    { label: '隐私政策', href: '#' },
  ],
};

const socials = [
  { icon: Github, href: '#', label: 'GitHub' },
  { icon: Twitter, href: '#', label: 'Twitter' },
  { icon: MessageCircle, href: '#', label: 'Discord' },
];

export function Footer() {
  return (
    <footer id="about" className="bg-[#0a0a0f] pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#5b8c3e] to-[#3d6b24] flex items-center justify-center">
                <span className="text-white font-bold text-lg" style={{ fontFamily: 'monospace' }}>MC</span>
              </div>
              <span className="text-xl font-bold text-white">Craft Launcher</span>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed">
              为 Minecraft 玩家打造的现代化启动器，提供快速、安全、便捷的游戏体验。
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">产品</h4>
            <ul className="space-y-2">
              {links.product.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-gray-500 hover:text-white transition-colors text-sm">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">资源</h4>
            <ul className="space-y-2">
              {links.resources.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-gray-500 hover:text-white transition-colors text-sm">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">支持</h4>
            <ul className="space-y-2">
              {links.support.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-gray-500 hover:text-white transition-colors text-sm">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-white/5 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-600 text-sm">
              © 2026 Craft Launcher. All rights reserved.
            </p>
            
            <div className="flex items-center gap-4">
              {socials.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  className="w-10 h-10 rounded-lg bg-white/5 hover:bg-[#4b3fe3]/20 flex items-center justify-center transition-all group"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5 text-gray-400 group-hover:text-[#4b3fe3] transition-colors" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}