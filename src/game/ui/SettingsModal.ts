import { Container, Graphics, Text } from "pixi.js";
import { GAME_WIDTH, GAME_HEIGHT } from "../constants";
import { SaveManager } from "../utils/SaveManager";
import { AudioMixer } from "../utils/AudioMixer";
import { HyperButton, HyperCircleButton } from "./HyperButton";
import { VectorIcons } from "./VectorIcons";

export class SettingsModal extends Container {
  private modalContainer: Container;
  private contentContainer: Container;
  private onCloseCallback: () => void;

  constructor(onClose: () => void) {
    super();
    this.onCloseCallback = onClose;

    // 1. Semi-Transparent Dark Blur Backdrop
    const backdrop = new Graphics();
    backdrop.rect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    backdrop.fill({ color: 0x000000, alpha: 0.78 });
    backdrop.eventMode = "static";
    backdrop.on("pointerdown", (e) => e.stopPropagation());
    this.addChild(backdrop);

    // 2. Central 3D Modal Window
    this.modalContainer = new Container();
    this.modalContainer.x = GAME_WIDTH / 2;
    this.modalContainer.y = GAME_HEIGHT / 2;
    this.addChild(this.modalContainer);

    const cardW = 560;
    const cardH = 720;

    // Soft Card Shadow
    const cardShadow = new Graphics();
    cardShadow
      .roundRect(-cardW / 2 + 8, -cardH / 2 + 16, cardW, cardH, 28)
      .fill({ color: 0x000000, alpha: 0.35 });
    this.modalContainer.addChild(cardShadow);

    // Thick 3D Royal Blue Border (Marth3 Design Standard)
    const borderBg = new Graphics();
    borderBg
      .roundRect(-cardW / 2, -cardH / 2 + 8, cardW, cardH, 28)
      .fill(0x0369a1); // Shadow Base
    borderBg
      .roundRect(-cardW / 2, -cardH / 2, cardW, cardH, 28)
      .fill(0x0284c7) // Main Border
      .stroke({ color: 0xffffff, width: 4.5 });
    this.modalContainer.addChild(borderBg);

    // Bright Cream Card Face
    const cardFace = new Graphics();
    cardFace
      .roundRect(-cardW / 2 + 14, -cardH / 2 + 14, cardW - 28, cardH - 28, 20)
      .fill(0xfbfaf5);
    this.modalContainer.addChild(cardFace);

    // 3. Floating 3D Title Ribbon (Cyan / Sky Blue)
    const ribbonW = 340;
    const ribbonH = 64;
    const ribbonY = -cardH / 2;

    const ribbon = new Graphics();
    ribbon
      .roundRect(-ribbonW / 2, ribbonY + 6, ribbonW, ribbonH, ribbonH / 2)
      .fill(0x0369a1); // Shadow
    ribbon
      .roundRect(-ribbonW / 2, ribbonY, ribbonW, ribbonH, ribbonH / 2)
      .fill(0x0ea5e9)
      .stroke({ color: 0xffffff, width: 4 });
    ribbon
      .roundRect(-ribbonW / 2 + 16, ribbonY + 4, ribbonW - 32, ribbonH * 0.38, 12)
      .fill({ color: 0xffffff, alpha: 0.35 });
    this.modalContainer.addChild(ribbon);

    // Title Row with crisp vector gear icon + Text
    const titleRow = new Container();
    titleRow.y = ribbonY + ribbonH / 2 - 2;

    const gearIcon = VectorIcons.createIcon("gear", 26, 0xffffff);
    gearIcon.x = -100;
    titleRow.addChild(gearIcon);

    const titleText = new Text({
      text: "CÀI ĐẶT GAME",
      style: {
        fontFamily: "Be Vietnam Pro, sans-serif",
        fontSize: 23,
        fontWeight: "900",
        fill: 0xffffff,
        stroke: { color: 0x0369a1, width: 3.5 },
        letterSpacing: 1.5,
      },
    });
    titleText.anchor.set(0, 0.5);
    titleText.x = -76;
    titleRow.addChild(titleText);
    this.modalContainer.addChild(titleRow);

    // 4. Top-Right Circular Close Button (HyperCircleButton ❌ with crisp vector cross)
    const closeCornerBtn = new HyperCircleButton({
      vectorIcon: "cross",
      radius: 22,
      color: 0xef4444,
      shadowColor: 0x991b1b,
      strokeWidth: 3,
      onClick: () => {
        this.destroy();
        this.onCloseCallback();
      },
    });
    closeCornerBtn.x = cardW / 2 - 18;
    closeCornerBtn.y = -cardH / 2 + 18;
    this.modalContainer.addChild(closeCornerBtn);

    // 5. Settings Content Rows
    this.contentContainer = new Container();
    this.contentContainer.y = -cardH / 2 + 68;
    this.modalContainer.addChild(this.contentContainer);

    this.renderSettings();

    // 6. Bottom Confirm / Close Button (HyperButton with crisp vector check)
    const doneBtn = new HyperButton({
      label: "ĐỒNG Ý",
      vectorIcon: "check",
      width: 240,
      height: 56,
      fontSize: 20,
      color: 0x0ea5e9,
      shadowColor: 0x0369a1,
      onClick: () => {
        this.destroy();
        this.onCloseCallback();
      },
    });
    doneBtn.y = cardH / 2 - 46;
    this.modalContainer.addChild(doneBtn);
  }

  private renderSettings() {
    this.contentContainer.removeChildren();
    const settings = SaveManager.getSettings();

    const rows: {
      id: string;
      label: string;
      iconType: "speaker" | "music" | "vibration" | "lightning";
      iconColor: number;
      pillColor: number;
      enabled: boolean;
      onToggle: () => void;
    }[] = [
      {
        id: "sfx",
        label: "Âm thanh (SFX)",
        iconType: "speaker",
        iconColor: 0x0284c7,
        pillColor: 0xe0f2fe,
        enabled: !settings.sfxMuted,
        onToggle: () => {
          SaveManager.updateSettings({ sfxMuted: !settings.sfxMuted });
          AudioMixer.setVolumes({ sfxMuted: !settings.sfxMuted });
          this.renderSettings();
        },
      },
      {
        id: "bgm",
        label: "Nhạc nền (BGM)",
        iconType: "music",
        iconColor: 0x2563eb,
        pillColor: 0xdbeafe,
        enabled: !settings.bgmMuted,
        onToggle: () => {
          SaveManager.updateSettings({ bgmMuted: !settings.bgmMuted });
          AudioMixer.setVolumes({ bgmMuted: !settings.bgmMuted });
          this.renderSettings();
        },
      },
      {
        id: "shake",
        label: "Rung màn hình",
        iconType: "vibration",
        iconColor: 0xf97316,
        pillColor: 0xffedd5,
        enabled: settings.screenShake,
        onToggle: () => {
          SaveManager.updateSettings({ screenShake: !settings.screenShake });
          this.renderSettings();
        },
      },
      {
        id: "particles",
        label: "Hiệu ứng đồ họa",
        iconType: "lightning",
        iconColor: 0xeab308,
        pillColor: 0xfef9c3,
        enabled: !settings.lowParticles,
        onToggle: () => {
          SaveManager.updateSettings({ lowParticles: !settings.lowParticles });
          this.renderSettings();
        },
      },
    ];

    const rowH = 68;
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const rowY = i * rowH;

      // Pure White Row Card with Light Blue Stroke
      const rowBg = new Graphics();
      rowBg
        .roundRect(-240, rowY, 480, 56, 16)
        .fill(0xffffff)
        .stroke({ color: 0xe2e8f0, width: 2 });
      this.contentContainer.addChild(rowBg);

      // Icon Pill with Vector Icon
      const iconPill = new Graphics();
      iconPill.circle(-210, rowY + 28, 18).fill(r.enabled ? r.pillColor : 0xf1f5f9);
      this.contentContainer.addChild(iconPill);

      const vectorIcon = VectorIcons.createIcon(
        r.iconType,
        22,
        r.enabled ? r.iconColor : 0x94a3b8,
      );
      vectorIcon.x = -210;
      vectorIcon.y = rowY + 28;
      this.contentContainer.addChild(vectorIcon);

      // Label Text
      const label = new Text({
        text: r.label,
        style: {
          fontFamily: "Be Vietnam Pro, sans-serif",
          fontSize: 16,
          fontWeight: "800",
          fill: 0x1e293b,
        },
      });
      label.x = -180;
      label.y = rowY + 18;
      this.contentContainer.addChild(label);

      // Cute 3D Toggle Switch (Knob + Track)
      const toggleSwitch = this.create3DToggleSwitch(r.enabled, r.onToggle);
      toggleSwitch.x = 180;
      toggleSwitch.y = rowY + 28;
      this.contentContainer.addChild(toggleSwitch);
    }

    // Info How-To-Play Card (Soft Ivory Box with Gold Border)
    const infoY = rows.length * rowH + 10;
    const infoBg = new Graphics();
    infoBg
      .roundRect(-240, infoY, 480, 110, 16)
      .fill(0xfefce8)
      .stroke({ color: 0xfacc15, width: 2 });
    this.contentContainer.addChild(infoBg);

    const infoTitle = new Text({
      text: "HƯỚNG DẪN CHIẾN ĐẤU",
      style: {
        fontFamily: "Be Vietnam Pro, sans-serif",
        fontSize: 14,
        fontWeight: "900",
        fill: 0xb45309,
        letterSpacing: 1,
      },
    });
    infoTitle.x = -222;
    infoTitle.y = infoY + 10;
    this.contentContainer.addChild(infoTitle);

    const infoBody = new Text({
      text: "• Vuốt kéo để lái xe tránh đâm quái vật trực diện.\n• Thu thập Phế liệu để nâng cấp vĩnh viễn trong Xưởng Xe.\n• Trang bị Tên Lửa và Laser để quét sạch quái cự ly xa!",
      style: {
        fontFamily: "Be Vietnam Pro, sans-serif",
        fontSize: 12.5,
        fontWeight: "600",
        fill: 0x78350f,
        lineHeight: 18,
      },
    });
    infoBody.x = -222;
    infoBody.y = infoY + 34;
    this.contentContainer.addChild(infoBody);

    // Reset Progress Text Link (Subtle Red Link)
    const resetY = infoY + 130;
    const resetBtn = new Text({
      text: "Đặt lại toàn bộ tiến trình Xưởng Xe",
      style: {
        fontFamily: "Be Vietnam Pro, sans-serif",
        fontSize: 13,
        fontWeight: "800",
        fill: 0xef4444,
      },
    });
    resetBtn.anchor.set(0.5);
    resetBtn.y = resetY;
    resetBtn.eventMode = "static";
    resetBtn.cursor = "pointer";
    resetBtn.on("pointerdown", () => {
      if (window.confirm("Bạn có chắc chắn muốn xóa toàn bộ tiến trình và phế liệu không?")) {
        SaveManager.resetProgress();
        this.renderSettings();
      }
    });
    this.contentContainer.addChild(resetBtn);
  }

  private create3DToggleSwitch(enabled: boolean, onToggle: () => void): Container {
    const sw = new Container();
    const w = 74;
    const h = 34;
    const r = h / 2;

    // Track Shadow Base
    const trackShadow = new Graphics();
    trackShadow
      .roundRect(-w / 2, -h / 2 + 3, w, h, r)
      .fill(enabled ? 0x15803d : 0x64748b);
    sw.addChild(trackShadow);

    // Track Body
    const track = new Graphics();
    track
      .roundRect(-w / 2, -h / 2, w, h, r)
      .fill(enabled ? 0x22c55e : 0x94a3b8)
      .stroke({ color: 0xffffff, width: 2 });
    sw.addChild(track);

    // Text ON/OFF indicator inside track
    const stateText = new Text({
      text: enabled ? "BẬT" : "TẮT",
      style: {
        fontFamily: "Be Vietnam Pro, sans-serif",
        fontSize: 11,
        fontWeight: "900",
        fill: 0xffffff,
      },
    });
    stateText.anchor.set(0.5);
    stateText.x = enabled ? -12 : 12;
    stateText.y = 0;
    sw.addChild(stateText);

    // 3D White Sliding Knob
    const knobX = enabled ? w / 2 - r : -w / 2 + r;
    const knobShadow = new Graphics();
    knobShadow.circle(knobX, 2, r - 3).fill(0x94a3b8);
    sw.addChild(knobShadow);

    const knob = new Graphics();
    knob.circle(knobX, 0, r - 3).fill(0xffffff).stroke({ color: 0xe2e8f0, width: 1.5 });
    // Knob shine
    knob.circle(knobX - 3, -3, (r - 3) * 0.4).fill({ color: 0xffffff, alpha: 0.8 });
    sw.addChild(knob);

    sw.eventMode = "static";
    sw.cursor = "pointer";
    sw.on("pointerdown", () => {
      AudioMixer.playSFX("sfx_button");
      onToggle();
    });

    return sw;
  }
}
