##Tips
###[Replacing tabs with spaces in Python code](http://goo.gl/V8T1I)
Here’s a really simple way to replace tabs with four spaces using sed on the commandline:
	sed 's/\\t/    /g' oldcode.py >newcode.py

Simply using the vim command,
	:retab
Your .vimrc or the ftplugin/python.vim needs to have the following:
	set tabstop=4
	set shiftwidth=4
	set expandtab