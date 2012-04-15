##How to install django on ubuntu using apache and mod_wsgi

A good way to do this is using Ubuntu server, Apache http server, mod_wsgi and MySQL database. Here are some basic instructions I wrote a while ago for setting up a production Django server with this combination:

How to setup django server with apache2 and MOD_WSGI

On a clean install of ubuntu
	sudo apt-get install apache2
install mod_wsgi for apache2. 
	sudo apt-get install libapache2-mod-wsgi
	sudo apt-get install python

Download current stable version of django from www.djangoproject.com
uncompress the tar 
	tar xzvf Django-1.2.3.tar.gz
	cd Django-1.2.3
	sudo python setup.py install

create a new project in /usr/local/src/ 
	sudo django-admin.py startproject myproject

Add this to the apache2 httpd.conf file (/etc/apache2/httpd.conf):
	Alias /media/ /var/www/media/
	<Directory /var/www/media>
	Order deny,allow
	Allow from all
	</Directory>
	WSGIScriptAlias / /var/www/apache/django.wsgi
	<Directory /var/www/apache>
	Order deny,allow
	Allow from all
	</Directory> 

create a new file in /var/www/apache/django.wsgi and put this in it:
	import os, sys
	root = os.path.join(os.path.dirname(__file__), '/usr/local/src')
	sys.path.insert(0, root)
	sys.path.append('/var/www')
	sys.path.append('/usr/local/src/myproject')
	os.environ['DJANGO_SETTINGS_MODULE'] = 'myproject.settings'
	import django.core.handlers.wsgi
	application = django.core.handlers.wsgi.WSGIHandler()

Change permissions
	chmod o+r /var/www/apache/django.wsgi
	chmod o+rx /var/www/apache
	chmod o+rx /usr/local/src

Put this line at the end of /etc/profile and /etc/bash.bashrc
	export PYTHONPATH=/usr/local/src/hunterparty:$PYTHONPATH
	export PYTHONPATH=/usr/local/src:$PYTHONPATH

Restart apache
	sudo /etc/init.d/apache2 restart


To install mysql db and link it with django
	sudo apt-get install mysql-server

Install python-mysqldb 
	sudo apt-get install python-mysqldb

log in to mysql and create a database for project
	mysql -u root -p
	CREATE DATABASE myproject;
	GRANT ALL ON myproject.* TO root@localhost;

edit myproject/settings.py and input database settings

cd to project directory then 
	./manage.py syncdb


To get admin site working
Add 'django.contrib.admin'  to your INSTALLED_APPS setting.
Admin has two dependencies - django.contrib.auth and django.contrib.contenttypes. If these applications are not in your INSTALLED_APPS list, add them.

	sudo chmod o+r django.wsgi
	sudo chmod o+rx /var/www/apache

copy admin media files to /var/www/media/ The files can be found in /usr/local/lib/python2.6/dist-packages/django/contrib/admin/media
	sudo cp /usr/local/lib/python2.6/dist-packages/django/contrib/admin/media/* /var/www/media/ -a

cd to project directory then 
	./manage.py syncdb

[src](http://goo.gl/iEuOB)

###Other
[Sessions vs Cookies](http://buildinternet.com/2010/07/when-to-use-_session-vs-_cookie/)


[var_dump](http://djangosnippets.org/snippets/743)
