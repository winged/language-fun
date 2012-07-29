
/* Aliases exports to window, so in the browser,
 * we can have our window.GUI, window.VM etc,
 * but in node, we have proper require() support.
 */
var exports = window;
