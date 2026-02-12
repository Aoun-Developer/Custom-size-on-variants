-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CustomSizeDesign" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "shop" TEXT NOT NULL,
    "imageLayout" TEXT DEFAULT 'vertical',
    "modalBgColor" TEXT,
    "borderWidth" INTEGER,
    "borderStyle" TEXT,
    "borderColor" TEXT,
    "textColor" TEXT,
    "placeholderColor" TEXT,
    "titleColor" TEXT,
    "noteColor" TEXT,
    "noteBgColor" TEXT,
    "noteTitleFontSizeDesktop" TEXT DEFAULT '18px',
    "noteContentFontSizeDesktop" TEXT DEFAULT '14px',
    "fieldTitleFontSizeDesktop" TEXT DEFAULT '14px',
    "fieldPlaceholderFontSizeDesktop" TEXT DEFAULT '13px',
    "noteTitleFontSizeMobile" TEXT DEFAULT '16px',
    "noteContentFontSizeMobile" TEXT DEFAULT '13px',
    "fieldTitleFontSizeMobile" TEXT DEFAULT '13px',
    "fieldPlaceholderFontSizeMobile" TEXT DEFAULT '12px',
    "customCss" TEXT,
    "displayStyle" TEXT NOT NULL DEFAULT 'INLINE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_CustomSizeDesign" ("borderColor", "borderStyle", "borderWidth", "createdAt", "customCss", "fieldPlaceholderFontSizeDesktop", "fieldPlaceholderFontSizeMobile", "fieldTitleFontSizeDesktop", "fieldTitleFontSizeMobile", "id", "imageLayout", "modalBgColor", "noteBgColor", "noteColor", "noteContentFontSizeDesktop", "noteContentFontSizeMobile", "noteTitleFontSizeDesktop", "noteTitleFontSizeMobile", "placeholderColor", "shop", "textColor", "titleColor", "updatedAt") SELECT "borderColor", "borderStyle", "borderWidth", "createdAt", "customCss", "fieldPlaceholderFontSizeDesktop", "fieldPlaceholderFontSizeMobile", "fieldTitleFontSizeDesktop", "fieldTitleFontSizeMobile", "id", "imageLayout", "modalBgColor", "noteBgColor", "noteColor", "noteContentFontSizeDesktop", "noteContentFontSizeMobile", "noteTitleFontSizeDesktop", "noteTitleFontSizeMobile", "placeholderColor", "shop", "textColor", "titleColor", "updatedAt" FROM "CustomSizeDesign";
DROP TABLE "CustomSizeDesign";
ALTER TABLE "new_CustomSizeDesign" RENAME TO "CustomSizeDesign";
CREATE UNIQUE INDEX "CustomSizeDesign_shop_key" ON "CustomSizeDesign"("shop");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
