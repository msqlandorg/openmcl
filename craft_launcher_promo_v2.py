from manim import *

def create_pixel_block(size=0.3, color="#4CAF50"):
    block = Square(side_length=size, fill_color=color, fill_opacity=1, stroke_width=0)
    return block

def create_terrain_row(y_pos, blocks_count=20, size=0.3):
    row = VGroup()
    colors_grass = ["#4CAF50", "#388E3C", "#66BB6A", "#2E7D32"]
    colors_dirt = ["#8D6E63", "#6D4C41", "#795548", "#5D4037"]
    for i in range(blocks_count):
        if y_pos >= 0:
            c = colors_grass[i % 4]
        else:
            c = colors_dirt[i % 4]
        block = create_pixel_block(size=size, color=c)
        block.shift(RIGHT * (i - blocks_count//2) * size + DOWN * y_pos * size)
        row.add(block)
    return row

def create_minecraft_world(rows=8, blocks_count=24, size=0.25):
    world = VGroup()
    for y in range(rows):
        row = create_terrain_row(y, blocks_count=blocks_count, size=size)
        world.add(row)
    return world

class CraftLauncherPromoV2(Scene):
    def construct(self):
        self.camera.background_color = "#0d1117"
        
        # ============ 第一幕：开场Logo ============
        def create_logo_cube():
            cube = VGroup()
            colors = ["#4CAF50", "#66BB6A", "#81C784", "#A5D6A7"]
            for i in range(4):
                for j in range(4):
                    pixel = Square(side_length=0.4, fill_color=colors[(i+j)%4], fill_opacity=1, stroke_width=0)
                    pixel.shift(RIGHT * j * 0.4 + DOWN * i * 0.4)
                    cube.add(pixel)
            cube.shift(LEFT * 0.6 + UP * 0.6)
            return cube
        
        logo_cube = create_logo_cube().scale(1.5)
        logo_text = Text("Craft Launcher", font="Microsoft YaHei", weight=BOLD).scale(1.6)
        logo_text.set_color("#4CAF50")
        
        logo_group = VGroup(logo_cube, logo_text).arrange(RIGHT, buff=0.6)
        logo_group.move_to(ORIGIN)
        
        subtitle = Text("专业的 Minecraft 启动器", font="Microsoft YaHei").scale(0.6)
        subtitle.set_color("#888888")
        subtitle.next_to(logo_group, DOWN, buff=0.5)
        
        website = Text("mcl.site.je", font="Microsoft YaHei", weight=BOLD).scale(0.5)
        website.set_color("#81C784")
        website.next_to(subtitle, DOWN, buff=0.3)
        
        self.play(DrawBorderThenFill(logo_cube), run_time=1.2)
        self.play(Write(logo_text), run_time=1)
        self.play(FadeIn(subtitle), FadeIn(website), run_time=0.6)
        self.wait(1)
        
        # Logo和副标题一起淡出，不再留在屏幕上
        self.play(
            FadeOut(logo_group),
            FadeOut(subtitle),
            FadeOut(website),
            run_time=0.8
        )
        
        # ============ 第二幕：进入游戏世界 ============
        world_bg = create_minecraft_world(rows=10, blocks_count=30, size=0.22)
        world_bg.scale(0.8)
        world_bg.shift(DOWN * 1.5)
        world_bg.set_opacity(0)
        
        world_title = Text("开启你的冒险之旅", font="Microsoft YaHei", weight=BOLD).scale(1)
        world_title.set_color("#4CAF50")
        world_title.move_to(ORIGIN).shift(UP * 0.5)
        
        world_desc = Text("点击启动，进入无穷无尽的方块世界", font="Microsoft YaHei").scale(0.5)
        world_desc.set_color("#888888")
        world_desc.next_to(world_title, DOWN, buff=0.4)
        
        self.play(Write(world_title), FadeIn(world_desc), run_time=0.8)
        
        # 像素地形从底部渐入（更明显的效果）
        for row in world_bg:
            row.set_opacity(0)
            row.shift(DOWN * 3)
            self.play(row.animate.shift(UP * 3).set_opacity(0.4), run_time=0.15)
        
        self.wait(1)
        
        # 模拟世界放大进入游戏（更强的过渡效果）
        self.play(
            world_title.animate.scale(2).set_opacity(0),
            world_desc.animate.scale(2).set_opacity(0),
            world_bg.animate.scale(3).shift(UP * 2).set_opacity(0.8),
            run_time=1.5,
            rate_func=smooth
        )
        self.wait(0.3)
        
        # 闪白切换到下一幕
        flash = Rectangle(width=14, height=8, fill_color=WHITE, fill_opacity=0.8, stroke_width=0)
        self.play(FadeIn(flash), run_time=0.1)
        self.play(FadeOut(flash), FadeOut(world_bg), run_time=0.3)
        self.wait(0.2)
        
        # ============ 第三幕：六大功能特性 ============
        section_title = Text("强大功能，极致体验", font="Microsoft YaHei", weight=BOLD).scale(1.1)
        section_title.set_color("#4CAF50")
        section_title.to_edge(UP, buff=1)
        
        features = [
            ("多版本管理", "支持原版 / Forge / Fabric", "#2196F3"),
            ("极速下载", "多源切换，更快更稳定", "#4CAF50"),
            ("模组中心", "Modrinth 一站式管理", "#FF9800"),
            ("智能配置", "自动检测 Java，优化内存", "#E91E63"),
            ("实例管理", "多实例独立运行，互不干扰", "#9C27B0"),
            ("精美界面", "深色主题，流畅动画", "#00BCD4"),
        ]
        
        feature_grid = VGroup()
        row1 = VGroup()
        row2 = VGroup()
        
        for i, (title, desc, color) in enumerate(features):
            card_bg = RoundedRectangle(width=4, height=1.8, corner_radius=0.2,
                                       fill_color="#1a1a2e", fill_opacity=0.9,
                                       stroke_color=color, stroke_width=2)
            
            icon_dot = Circle(radius=0.2, fill_color=color, fill_opacity=1, stroke_width=0)
            icon_dot.shift(UP * 0.4)
            
            title_text = Text(title, font="Microsoft YaHei", weight=BOLD).scale(0.45)
            title_text.set_color(WHITE)
            title_text.next_to(icon_dot, DOWN, buff=0.1)
            
            desc_text = Text(desc, font="Microsoft YaHei").scale(0.3)
            desc_text.set_color("#888888")
            desc_text.next_to(title_text, DOWN, buff=0.1)
            
            card = VGroup(card_bg, icon_dot, title_text, desc_text)
            
            if i < 3:
                row1.add(card)
            else:
                row2.add(card)
        
        row1.arrange(RIGHT, buff=0.5)
        row2.arrange(RIGHT, buff=0.5)
        feature_grid.add(row1, row2)
        feature_grid.arrange(DOWN, buff=0.4)
        feature_grid.move_to(ORIGIN).shift(DOWN * 0.3)
        
        self.play(Write(section_title), run_time=0.5)
        
        for card in row1:
            card.shift(LEFT * 8)
            self.play(card.animate.shift(RIGHT * 8), run_time=0.3)
        
        for card in row2:
            card.shift(RIGHT * 8)
            self.play(card.animate.shift(LEFT * 8), run_time=0.3)
        
        self.wait(1.5)
        
        # ============ 第四幕：数据展示 ============
        self.play(FadeOut(feature_grid), FadeOut(section_title), run_time=0.6)
        
        stats_title = Text("为什么选择 Craft Launcher？", font="Microsoft YaHei", weight=BOLD).scale(1)
        stats_title.set_color("#4CAF50")
        stats_title.to_edge(UP, buff=1)
        
        stats = [
            ("100+", "支持版本数"),
            ("99.9%", "下载成功率"),
            ("0", "广告弹窗"),
            ("极速", "下载速度"),
            ("多源", "下载源切换"),
            ("一键", "模组安装"),
        ]
        
        stats_grid = VGroup()
        srow1 = VGroup()
        srow2 = VGroup()
        
        for i, (value, label) in enumerate(stats):
            val_text = Text(value, font="Microsoft YaHei", weight=BOLD).scale(1)
            val_text.set_color("#4CAF50")
            lab_text = Text(label, font="Microsoft YaHei").scale(0.35)
            lab_text.set_color("#888888")
            
            stat = VGroup(val_text, lab_text).arrange(DOWN, buff=0.15)
            
            if i < 3:
                srow1.add(stat)
            else:
                srow2.add(stat)
        
        srow1.arrange(RIGHT, buff=2)
        srow2.arrange(RIGHT, buff=2)
        stats_grid.add(srow1, srow2)
        stats_grid.arrange(DOWN, buff=0.5)
        stats_grid.move_to(ORIGIN).shift(DOWN * 0.3)
        
        self.play(Write(stats_title), run_time=0.5)
        
        for stat in srow1:
            stat.scale(0)
            self.play(stat.animate.scale(1), run_time=0.3)
        
        for stat in srow2:
            stat.scale(0)
            self.play(stat.animate.scale(1), run_time=0.3)
        
        self.wait(1.5)
        
        # ============ 第五幕：启动演示 ============
        self.play(FadeOut(stats_grid), FadeOut(stats_title), run_time=0.6)
        
        launch_title = Text("一键启动，即刻开始游戏", font="Microsoft YaHei", weight=BOLD).scale(1.1)
        launch_title.set_color("#4CAF50")
        launch_title.to_edge(UP, buff=1)
        
        btn_bg = RoundedRectangle(width=5, height=1, corner_radius=0.5,
                                  fill_color="#4CAF50", fill_opacity=1, stroke_width=0)
        btn_text = Text("启动游戏", font="Microsoft YaHei", weight=BOLD).scale(0.6)
        btn_text.set_color(WHITE)
        button = VGroup(btn_bg, btn_text)
        button.move_to(ORIGIN).shift(UP * 0.5)
        
        # 进度条区域
        bar_bg = Rectangle(width=8, height=0.5, fill_color="#1a1a2e", fill_opacity=1,
                           stroke_color="#333333", stroke_width=1)
        bar_fill = Rectangle(width=0, height=0.5, fill_color="#4CAF50", fill_opacity=1, stroke_width=0)
        bar_fill.align_to(bar_bg, LEFT)
        bar_group = VGroup(bar_bg, bar_fill)
        bar_group.move_to(ORIGIN).shift(DOWN * 0.5)
        
        # 步骤指示器（7个小圆圈）
        steps_indicator = VGroup()
        step_circles = []
        for i in range(7):
            circle = Circle(radius=0.15, fill_color="#333333", fill_opacity=1, stroke_width=0)
            step_circles.append(circle)
            steps_indicator.add(circle)
        steps_indicator.arrange(RIGHT, buff=0.5)
        steps_indicator.next_to(bar_group, DOWN, buff=0.4)
        
        step_label = Text("准备中...", font="Microsoft YaHei").scale(0.5)
        step_label.set_color("#888888")
        step_label.next_to(steps_indicator, DOWN, buff=0.3)
        
        self.play(Write(launch_title), run_time=0.5)
        self.play(FadeIn(button), run_time=0.5)
        self.wait(0.5)
        
        # 点击按钮
        self.play(button.animate.scale(0.92), run_time=0.1)
        self.play(button.animate.scale(1.05), run_time=0.1)
        self.play(button.animate.scale(1), run_time=0.1)
        
        self.play(FadeOut(button), FadeIn(bar_group), FadeIn(steps_indicator), FadeIn(step_label), run_time=0.3)
        
        # 7步进度条动画
        launch_steps = [
            ("检查环境", 14),
            ("加载版本", 28),
            ("验证文件", 42),
            ("解压资源", 57),
            ("构建参数", 71),
            ("启动进程", 85),
            ("游戏启动", 100),
        ]
        
        for idx, (step_name, percent) in enumerate(launch_steps):
            # 创建新的步骤文字替换旧的
            new_label = Text(step_name, font="Microsoft YaHei").scale(0.5)
            new_label.set_color("#4CAF50")
            new_label.move_to(step_label)
            
            # 更新进度条 + 替换文字
            self.play(
                bar_fill.animate.set_width(8 * percent / 100),
                ReplacementTransform(step_label, new_label),
                run_time=0.5
            )
            step_label = new_label
            
            # 点亮当前步骤指示器
            self.play(step_circles[idx].animate.set_fill("#4CAF50"), run_time=0.2)
            self.wait(0.2)
        
        self.wait(0.8)
        
        # ============ 第六幕：游戏画面过渡 ============
        self.play(FadeOut(bar_group), FadeOut(steps_indicator), FadeOut(step_label), FadeOut(launch_title), run_time=0.5)
        
        game_world = create_minecraft_world(rows=15, blocks_count=36, size=0.18)
        game_world.scale(1.8)
        game_world.shift(DOWN * 0.5)
        game_world.set_opacity(0)
        
        sun = Circle(radius=0.5, fill_color="#FFD54F", fill_opacity=0.8, stroke_width=0)
        sun.shift(UP * 2 + RIGHT * 4)
        
        def create_cloud(x, y, scale=1):
            cloud = VGroup()
            for i in range(4):
                c = Circle(radius=0.25 * scale, fill_color=WHITE, fill_opacity=0.3, stroke_width=0)
                c.shift(RIGHT * i * 0.3 * scale + UP * (0.1 if i % 2 else 0) * scale)
                cloud.add(c)
            cloud.shift(RIGHT * x + UP * y)
            return cloud
        
        cloud1 = create_cloud(-3, 2.5, 1.2)
        cloud2 = create_cloud(2, 3, 1)
        
        # 游戏世界渐入
        self.play(FadeIn(sun), FadeIn(cloud1), FadeIn(cloud2), run_time=0.8)
        
        for row in game_world:
            row.set_opacity(0)
            row.shift(DOWN * 2)
        
        for row in game_world:
            self.play(row.animate.shift(UP * 2).set_opacity(0.3), run_time=0.08)
        
        game_text = Text("欢迎来到 Minecraft 的世界", font="Microsoft YaHei", weight=BOLD).scale(1)
        game_text.set_color(WHITE)
        game_text.move_to(ORIGIN).shift(UP * 0.5)
        
        game_sub = Text("由 Craft Launcher 强力驱动", font="Microsoft YaHei").scale(0.5)
        game_sub.set_color("#81C784")
        game_sub.next_to(game_text, DOWN, buff=0.4)
        
        self.play(Write(game_text), FadeIn(game_sub), run_time=0.8)
        self.wait(1.5)
        
        # ============ 第七幕：结尾 ============
        self.play(FadeOut(game_world), FadeOut(sun), FadeOut(cloud1), FadeOut(cloud2),
                  FadeOut(game_text), FadeOut(game_sub), run_time=0.6)
        
        final_logo = create_logo_cube().scale(2)
        final_title = Text("Craft Launcher", font="Microsoft YaHei", weight=BOLD).scale(1.8)
        final_title.set_color("#4CAF50")
        
        final_group = VGroup(final_logo, final_title).arrange(RIGHT, buff=0.6)
        final_group.move_to(ORIGIN).shift(UP * 0.5)
        
        final_version = Text("v1.0.0 正式版", font="Microsoft YaHei").scale(0.5)
        final_version.set_color("#888888")
        final_version.next_to(final_group, DOWN, buff=0.4)
        
        final_website = Text("mcl.site.je", font="Microsoft YaHei", weight=BOLD).scale(0.6)
        final_website.set_color("#81C784")
        final_website.next_to(final_version, DOWN, buff=0.3)
        
        dl_bg = RoundedRectangle(width=4, height=0.9, corner_radius=0.45,
                                  fill_color="#4CAF50", fill_opacity=1, stroke_width=0)
        dl_text = Text("立即下载", font="Microsoft YaHei", weight=BOLD).scale(0.5)
        dl_text.set_color(WHITE)
        dl_button = VGroup(dl_bg, dl_text)
        dl_button.next_to(final_website, DOWN, buff=0.6)
        
        self.play(DrawBorderThenFill(final_logo), Write(final_title), run_time=1)
        self.play(FadeIn(final_version), FadeIn(final_website), run_time=0.5)
        self.play(FadeIn(dl_button), run_time=0.5)
        
        for _ in range(2):
            self.play(dl_button.animate.scale(1.1), run_time=0.3)
            self.play(dl_button.animate.scale(1), run_time=0.3)
        
        self.wait(2)


if __name__ == "__main__":
    scene = CraftLauncherPromoV2()
    scene.render()