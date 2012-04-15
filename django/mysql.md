##MySQL Installation

###Download 
Use the 64 bit .dmg file from here: [link](http://dev.mysql.com/downloads/mysql/)

###Run the installer
Install path: /usr/local/mysql

Add /usr/local/mysql/bin to the PATH variable in .bash_profile
Run the script to secure it: 
	mysql_secure_installation
Make sure the folder containing the libmysqlclient.18.dylib is in the DYLD_LIBRARY_PATH
Run this command:
	export DYLD_LIBRARY_PATH=/usr/local/mysql/lib/
Or for it to be permanent add that line to .bash_profile

##MySQLdb Python Connector

Download the source from here: [link](http://sourceforge.net/projects/mysql-python/files/mysql-python/1.2.3/)

Unarchive it: 
	tar xvfz MySQL-python-1.2.3.tar.gz
From within the directory run these commands:
	python setup.py build
	sudo python setup.py install

##Easy Install
An alternative way to install is to run this command:
	easy_install MySQL-python

[Nate's Wiki](http://wiki.salisburyenterprises.com/doku.php/nates:mac:mysql:mysql)