import { Container, Graphics, Text } from 'pixi.js';
import {
    GAME_WIDTH, GAME_HEIGHT, COLORS,
    BOSS_HP_BAR_WIDTH, BOSS_HP_BAR_HEIGHT, BOSS_HP_BAR_Y,
} from '../constants';
import { EventBus } from '../utils/EventBus';

export class HUD extends Container {
    // Top bar Pills
    private distanceText: Text;
    private killText: Text;
    private scrapText: Text;

    // XP bar (bottom)
    private xpBarBg: Graphics;
    private xpBarFill: Graphics;
    private levelText: Text;

    // Boss HP bar (top center)
    private bossHpContainer: Container;
    private bossHpBg: Graphics;
    private bossHpFill: Graphics;
    private bossNameText: Text;

    // Weapons Inventory Dock
    private weaponsContainer: Container;

    // Damage numbers
    private damageNumbers: DamageNumber[] = [];

    constructor() {
        super();

        // ── 1. Distance Pill (Top Left) ──
        const distPill = new Graphics();
        distPill.roundRect(16, 16, 150, 42, 21)
            .fill(0x1e293b)
            .stroke({ color: 0xffffff, width: 2.5 });
        this.addChild(distPill);

        this.distanceText = new Text({
            text: '📏 0 m',
            style: {
                fontFamily: 'Be Vietnam Pro, sans-serif',
                fontSize: 20,
                fill: 0xffffff,
                fontWeight: '900',
            },
        });
        this.distanceText.anchor.set(0, 0.5);
        this.distanceText.x = 30;
        this.distanceText.y = 37;
        this.addChild(this.distanceText);

        // ── 2. Kills Pill (Top Right) ──
        const killPill = new Graphics();
        killPill.roundRect(GAME_WIDTH - 140, 16, 124, 42, 21)
            .fill(0x7f1d1d)
            .stroke({ color: 0xffffff, width: 2.5 });
        this.addChild(killPill);

        this.killText = new Text({
            text: '💀 0',
            style: {
                fontFamily: 'Be Vietnam Pro, sans-serif',
                fontSize: 20,
                fill: 0xffffff,
                fontWeight: '900',
            },
        });
        this.killText.anchor.set(0.5);
        this.killText.x = GAME_WIDTH - 78;
        this.killText.y = 37;
        this.addChild(this.killText);

        // ── 3. Scrap Pill (Below Kills) ──
        const scrapPill = new Graphics();
        scrapPill.roundRect(GAME_WIDTH - 140, 66, 124, 40, 20)
            .fill(0x78350f)
            .stroke({ color: 0xffffff, width: 2.5 });
        this.addChild(scrapPill);

        this.scrapText = new Text({
            text: '🔩 0',
            style: {
                fontFamily: 'Be Vietnam Pro, sans-serif',
                fontSize: 18,
                fill: 0xfacc15,
                fontWeight: '900',
            },
        });
        this.scrapText.anchor.set(0.5);
        this.scrapText.x = GAME_WIDTH - 78;
        this.scrapText.y = 86;
        this.addChild(this.scrapText);

        // ── 4. XP Bar (Bottom) ──
        const xpY = GAME_HEIGHT - 32;
        const xpBarW = GAME_WIDTH - 150;

        // Shadow & Frame
        this.xpBarBg = new Graphics();
        this.xpBarBg.roundRect(110, xpY, xpBarW, 18, 9)
            .fill(0x0f172a)
            .stroke({ color: 0xffffff, width: 2 });
        this.addChild(this.xpBarBg);

        this.xpBarFill = new Graphics();
        this.addChild(this.xpBarFill);

        // Level Pill
        const levelBadge = new Graphics();
        levelBadge.roundRect(16, xpY - 3, 84, 24, 12)
            .fill(0x2563eb)
            .stroke({ color: 0xffffff, width: 2 });
        this.addChild(levelBadge);

        this.levelText = new Text({
            text: 'CẤP 1',
            style: {
                fontFamily: 'Be Vietnam Pro, sans-serif',
                fontSize: 13,
                fill: 0xffffff,
                fontWeight: '900',
            },
        });
        this.levelText.anchor.set(0.5);
        this.levelText.x = 58;
        this.levelText.y = xpY + 9;
        this.addChild(this.levelText);

        // ── 4b. Weapons Inventory Bar (Just above XP Bar) ──
        this.weaponsContainer = new Container();
        this.weaponsContainer.y = GAME_HEIGHT - 74;
        this.addChild(this.weaponsContainer);

        // ── 5. Boss HP Bar (Top Center) ──
        this.bossHpContainer = new Container();
        this.bossHpContainer.visible = false;
        this.addChild(this.bossHpContainer);

        this.bossHpBg = new Graphics();
        this.bossHpBg.roundRect(
            (GAME_WIDTH - BOSS_HP_BAR_WIDTH) / 2, BOSS_HP_BAR_Y,
            BOSS_HP_BAR_WIDTH, BOSS_HP_BAR_HEIGHT, 8
        );
        this.bossHpBg.fill(0x450a0a);
        this.bossHpBg.stroke({ color: 0xffffff, width: 3 });
        this.bossHpContainer.addChild(this.bossHpBg);

        this.bossHpFill = new Graphics();
        this.bossHpContainer.addChild(this.bossHpFill);

        this.bossNameText = new Text({
            text: 'KẺ THU THẬP',
            style: {
                fontFamily: 'Be Vietnam Pro, sans-serif',
                fontSize: 18,
                fill: 0xffffff,
                fontWeight: '900',
                stroke: { color: 0x7f1d1d, width: 4 },
            },
        });
        this.bossNameText.anchor.set(0.5);
        this.bossNameText.x = GAME_WIDTH / 2;
        this.bossNameText.y = BOSS_HP_BAR_Y - 16;
        this.bossHpContainer.addChild(this.bossNameText);

        // Damage number listener
        EventBus.on('damage:number', (data) => {
            this.spawnDamageNumber(data.x, data.y, data.amount, data.crit, data.heal, data.status);
        });
    }

    updateDistance(meters: number) {
        this.distanceText.text = `📏 ${Math.floor(meters)} m`;
    }

    updateKills(kills: number) {
        this.killText.text = `💀 ${kills}`;
    }

    updateScrap(scrap: number) {
        this.scrapText.text = `🔩 ${scrap}`;
    }

    updateXp(ratio: number, level: number) {
        this.xpBarFill.clear();
        const xpY = GAME_HEIGHT - 32;
        const maxW = GAME_WIDTH - 150 - 4;
        const w = maxW * Math.min(1, Math.max(0, ratio));

        // Gradient XP bar
        this.xpBarFill.roundRect(112, xpY + 2, w, 14, 7)
            .fill(0x38bdf8);
        this.xpBarFill.roundRect(112, xpY + 2, w, 5, 2.5)
            .fill({ color: 0xffffff, alpha: 0.35 });

        this.levelText.text = `CẤP ${level}`;
    }

    /** Update equipped weapons dock tray */
    updateWeapons(weaponLevels: Record<string, number>) {
        this.weaponsContainer.removeChildren();

        const slotTypes = [
            { id: 'machine_gun', icon: '🔫', label: 'Súng Máy', color: 0xef4444 },
            { id: 'flamethrower', icon: '🔥', label: 'Phun Lửa', color: 0xf97316 },
            { id: 'tesla', icon: '⚡', label: 'Tesla', color: 0x06b6d4 },
            { id: 'shield', icon: '🛡️', label: 'Khiên', color: 0x3b82f6 },
        ];

        const slotW = 100;
        const slotH = 34;
        const gap = 12;
        const totalW = slotTypes.length * slotW + (slotTypes.length - 1) * gap;
        const startX = (GAME_WIDTH - totalW) / 2;

        for (let i = 0; i < slotTypes.length; i++) {
            const slot = slotTypes[i];
            const lvl = weaponLevels[slot.id] || 0;
            const isOwned = lvl > 0;

            const card = new Container();
            card.x = startX + i * (slotW + gap);

            // Card Background
            const bg = new Graphics();
            if (isOwned) {
                // 3D Equipped Card
                bg.roundRect(0, 3, slotW, slotH, 8).fill(0x0f172a);
                bg.roundRect(0, 0, slotW, slotH, 8)
                    .fill(0x1e293b)
                    .stroke({ color: slot.color, width: 2 });
            } else {
                // Locked slot
                bg.roundRect(0, 0, slotW, slotH, 8)
                    .fill({ color: 0x0f172a, alpha: 0.5 })
                    .stroke({ color: 0x334155, width: 1.5 });
            }
            card.addChild(bg);

            // Icon
            const icon = new Text({
                text: slot.icon,
                style: {
                    fontFamily: 'Be Vietnam Pro, sans-serif',
                    fontSize: 16,
                },
            });
            icon.anchor.set(0, 0.5);
            icon.x = 8;
            icon.y = slotH / 2;
            icon.alpha = isOwned ? 1 : 0.35;
            card.addChild(icon);

            // Star Badge / Level Text (e.g. ⭐⭐⭐ or Khóa)
            const badge = new Text({
                text: isOwned ? `⭐ ${lvl}` : 'Chưa có',
                style: {
                    fontFamily: 'Be Vietnam Pro, sans-serif',
                    fontSize: 12,
                    fill: isOwned ? 0xfacc15 : 0x64748b,
                    fontWeight: '900',
                },
            });
            badge.anchor.set(1, 0.5);
            badge.x = slotW - 8;
            badge.y = slotH / 2;
            card.addChild(badge);

            this.weaponsContainer.addChild(card);
        }
    }

    showBossHp(name: string) {
        this.bossHpContainer.visible = true;
        this.bossNameText.text = name;
    }

    updateBossHp(ratio: number) {
        this.bossHpFill.clear();
        const maxW = BOSS_HP_BAR_WIDTH - 6;
        const w = maxW * Math.max(0, Math.min(1, ratio));
        this.bossHpFill.roundRect(
            (GAME_WIDTH - BOSS_HP_BAR_WIDTH) / 2 + 3, BOSS_HP_BAR_Y + 3,
            w, BOSS_HP_BAR_HEIGHT - 6, 6
        );
        this.bossHpFill.fill(0xef4444);
        this.bossHpFill.roundRect(
            (GAME_WIDTH - BOSS_HP_BAR_WIDTH) / 2 + 3, BOSS_HP_BAR_Y + 3,
            w, (BOSS_HP_BAR_HEIGHT - 6) * 0.4, 4
        ).fill({ color: 0xffffff, alpha: 0.3 });
    }

    hideBossHp() {
        this.bossHpContainer.visible = false;
    }

    private spawnDamageNumber(x: number, y: number, amount: number, crit?: boolean, heal?: boolean, status?: 'burn' | 'shock' | 'crit') {
        const dn = new DamageNumber(x, y, amount, crit, heal, status);
        this.addChild(dn);
        this.damageNumbers.push(dn);
    }

    update(dt: number) {
        const dtSec = dt * (1 / 60);
        for (let i = this.damageNumbers.length - 1; i >= 0; i--) {
            const dn = this.damageNumbers[i];
            dn.life -= dtSec;
            dn.y -= 70 * dtSec;
            dn.scale.set(Math.min(1.4, dn.scale.x + dtSec * 0.5));
            dn.alpha = Math.max(0, dn.life / dn.maxLife);

            if (dn.life <= 0) {
                this.removeChild(dn);
                dn.destroy();
                this.damageNumbers.splice(i, 1);
            }
        }
    }
}

class DamageNumber extends Text {
    public life: number;
    public maxLife: number;

    constructor(x: number, y: number, amount: number, crit?: boolean, heal?: boolean, status?: 'burn' | 'shock' | 'crit') {
        let color = 0xffffff;
        let prefix = '';
        let size = 22;

        if (status === 'burn') {
            color = 0xff5500;
            prefix = '🔥 ';
            size = 20;
        } else if (status === 'shock') {
            color = 0x00e5ff;
            prefix = '⚡ ';
            size = 22;
        } else if (crit || status === 'crit') {
            color = 0xfacc15;
            prefix = '💥 ';
            size = 32;
        } else if (heal) {
            color = 0x22c55e;
            prefix = '+';
            size = 22;
        }

        super({
            text: `${prefix}${Math.round(amount)}`,
            style: {
                fontFamily: 'Be Vietnam Pro, sans-serif',
                fontSize: size,
                fill: color,
                fontWeight: '900',
                stroke: { color: 0x000000, width: 4 },
            },
        });

        this.anchor.set(0.5);
        this.x = x + (Math.random() - 0.5) * 24;
        this.y = y;
        this.life = 0.75;
        this.maxLife = 0.75;
    }
}
