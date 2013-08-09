/* Load this script using conditional IE comments if you need to support IE 7 and IE 6. */

window.onload = function() {
	function addIcon(el, entity) {
		var html = el.innerHTML;
		el.innerHTML = '<span style="font-family: \'icomoon\'">' + entity + '</span>' + html;
	}
	var icons = {
			'icon-calendar' : '&#xe000;',
			'icon-download' : '&#xe001;',
			'icon-checkmark' : '&#xe002;',
			'icon-twitter' : '&#xe003;',
			'icon-facebook' : '&#xe004;',
			'icon-share' : '&#xe005;',
			'icon-newspaper' : '&#xe006;',
			'icon-arrow-left' : '&#xe007;',
			'icon-cross' : '&#xe008;',
			'icon-user' : '&#xe009;',
			'icon-ellipsis' : '&#xe00a;',
			'icon-user-2' : '&#xe00b;',
			'icon-settings' : '&#xe00c;',
			'icon-refresh' : '&#xe00d;',
			'icon-export' : '&#xe00e;',
			'icon-hourglass' : '&#xe00f;',
			'icon-bubble' : '&#xe010;'
		},
		els = document.getElementsByTagName('*'),
		i, attr, html, c, el;
	for (i = 0; ; i += 1) {
		el = els[i];
		if(!el) {
			break;
		}
		attr = el.getAttribute('data-icon');
		if (attr) {
			addIcon(el, attr);
		}
		c = el.className;
		c = c.match(/icon-[^\s'"]+/);
		if (c && icons[c[0]]) {
			addIcon(el, icons[c[0]]);
		}
	}
};