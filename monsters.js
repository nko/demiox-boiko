exports = {};
exports.Monster(x, y, color) {
    this.x = x*Constants.tileSize;
    this.y = y*Constants.tileSize;
    this.color = color;
    this.ID = getUniqueID();
    this.rect = new Rect(this.x, this.y, this.x + this.W, this.y + this.W);
    gameState.monsters.push(this);
}
