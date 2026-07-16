from manim import *

class CraftLauncherIntro(Scene):
    def construct(self):
        self.camera.background_color = "#1a1a2e"
        
        title = Text("Craft Launcher", font="Arial", weight=BOLD).scale(2.5)
        title.set_color(GREEN_A)
        subtitle = Text("The Ultimate Minecraft Launcher", font="Arial").scale(0.8)
        subtitle.set_color(WHITE)
        
        title_group = VGroup(title, subtitle).arrange(DOWN, buff=0.5)
        
        cube = Cube(side_length=1.5, fill_opacity=0.8)
        cube.set_color(GREEN_C)
        cube.shift(LEFT * 3)
        
        sphere = Sphere(radius=0.8, fill_opacity=0.8)
        sphere.set_color(BLUE_C)
        sphere.shift(RIGHT * 3)
        
        torus = Torus(major_radius=0.7, minor_radius=0.3, fill_opacity=0.8)
        torus.set_color(YELLOW_C)
        
        shapes_group = VGroup(cube, sphere, torus)
        
        self.play(Create(cube), Create(sphere), Create(torus), run_time=1.5)
        self.play(cube.animate.rotate(PI/2, axis=UP), 
                  sphere.animate.rotate(PI/2, axis=RIGHT),
                  torus.animate.rotate(PI, axis=OUT),
                  run_time=2)
        self.play(FadeOut(shapes_group))
        
        self.play(Write(title), run_time=1.5)
        self.play(FadeIn(subtitle), run_time=0.8)
        self.wait(1)
        
        self.play(title.animate.scale(1.2).set_color(GREEN_B), 
                  subtitle.animate.shift(UP * 0.5),
                  run_time=0.8)
        self.wait(1)
        
        features = [
            ("版本管理", "管理所有 Minecraft 版本"),
            ("模组中心", "海量模组一键安装"),
            ("资源包", "美化你的游戏体验"),
            ("存档管理", "备份与恢复"),
        ]
        
        feature_cards = VGroup()
        for i, (title_text, desc) in enumerate(features):
            card = Rectangle(width=3, height=2, fill_color="#2d2d44", fill_opacity=0.8, stroke_color=GREEN_A)
            card_title = Text(title_text, font="Arial", weight=BOLD).scale(0.7)
            card_title.set_color(GREEN_A)
            card_desc = Text(desc, font="Arial").scale(0.4)
            card_desc.set_color(WHITE)
            card_content = VGroup(card_title, card_desc).arrange(DOWN, buff=0.3)
            card_content.move_to(card.get_center())
            card.add(card_content)
            feature_cards.add(card)
        
        feature_cards.arrange(RIGHT, buff=1.5).shift(DOWN * 2)
        
        for i, card in enumerate(feature_cards):
            card.shift(LEFT * 10)
            self.play(card.animate.shift(RIGHT * 10), run_time=0.5)
        
        self.wait(2)
        
        self.play(FadeOut(title_group), FadeOut(feature_cards), run_time=0.8)
        
        launch_text = Text("启动你的冒险", font="Arial", weight=BOLD).scale(2)
        launch_text.set_color(GREEN_A)
        
        arrow = Arrow(start=ORIGIN, end=UP * 2, color=GREEN_A, stroke_width=3)
        arrow.shift(DOWN * 0.5)
        
        self.play(Write(launch_text), run_time=1)
        self.play(GrowArrow(arrow), run_time=0.8)
        
        progress_bar = Rectangle(width=8, height=0.3, fill_color="#2d2d44", fill_opacity=1, stroke_color=GREEN_A)
        progress_fill = Rectangle(width=0, height=0.3, fill_color=GREEN_A, fill_opacity=1)
        progress_fill.move_to(progress_bar.get_left())
        
        progress_group = VGroup(progress_bar, progress_fill)
        progress_group.shift(DOWN * 1)
        
        progress_text = Text("0%", font="Arial").scale(0.6)
        progress_text.set_color(WHITE)
        progress_text.next_to(progress_group, DOWN, buff=0.3)
        
        self.play(FadeIn(progress_group), FadeIn(progress_text), run_time=0.5)
        
        progress_steps = [
            ("5%", "读取配置"),
            ("10%", "验证版本"),
            ("20%", "检测Java"),
            ("35%", "解压Natives"),
            ("50%", "构建Classpath"),
            ("70%", "准备启动参数"),
            ("85%", "启动进程"),
            ("100%", "游戏启动"),
        ]
        
        for percent, step in progress_steps:
            self.play(progress_fill.animate.set_width(8 * float(percent[:-1]) / 100),
                      progress_text.animate.set_text(percent),
                      run_time=0.5)
            step_text = Text(step, font="Arial").scale(0.5)
            step_text.set_color(YELLOW_A)
            step_text.next_to(progress_group, UP, buff=0.5)
            self.play(Write(step_text), run_time=0.3)
            self.wait(0.3)
            self.play(FadeOut(step_text), run_time=0.2)
        
        self.play(FadeOut(progress_group), FadeOut(progress_text), run_time=0.5)
        
        success_text = Text("游戏已启动！", font="Arial", weight=BOLD).scale(2)
        success_text.set_color(GREEN_A)
        
        mc_logo = Text("Minecraft", font="Arial", weight=BOLD).scale(1.5)
        mc_logo.set_color(WHITE)
        
        success_group = VGroup(success_text, mc_logo).arrange(DOWN, buff=0.5)
        
        self.play(Write(success_text), run_time=0.8)
        self.play(FadeIn(mc_logo), run_time=0.5)
        
        self.wait(1.5)
        
        download_text = Text("立即下载 Craft Launcher", font="Arial", weight=BOLD).scale(1.2)
        download_text.set_color(GREEN_A)
        
        download_button = Rectangle(width=6, height=1.5, fill_color=GREEN_A, fill_opacity=1, stroke_color=WHITE)
        download_button_text = Text("下载", font="Arial", weight=BOLD).scale(1)
        download_button_text.set_color(BLACK)
        download_button_text.move_to(download_button.get_center())
        download_button.add(download_button_text)
        
        download_group = VGroup(download_text, download_button).arrange(DOWN, buff=0.8)
        download_group.shift(DOWN * 2)
        
        self.play(FadeOut(launch_text), FadeOut(arrow), FadeOut(success_group), run_time=0.5)
        self.play(Write(download_text), run_time=0.8)
        self.play(Create(download_button), run_time=0.5)
        
        self.play(download_button.animate.scale(1.1), run_time=0.3)
        self.play(download_button.animate.scale(1), run_time=0.3)
        
        final_title = Text("Craft Launcher", font="Arial", weight=BOLD).scale(3)
        final_title.set_color(GREEN_A)
        final_title.shift(UP * 2)
        
        version_text = Text("v1.0.0", font="Arial").scale(0.8)
        version_text.set_color(WHITE)
        version_text.next_to(final_title, DOWN)
        
        self.play(FadeOut(download_group), run_time=0.5)
        self.play(Write(final_title), run_time=1)
        self.play(FadeIn(version_text), run_time=0.5)
        
        self.wait(2)

if __name__ == "__main__":
    scene = CraftLauncherIntro()
    scene.render()
