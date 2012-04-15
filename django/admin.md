##Adding features to the admin with signals

Signals are an under-used feature in Django that improve the modularity of your code. Signals define events, such as saving a model or loading a template, that function anywhere the Django project can listen for and respond to. This means you can easily augment the behavior of applications without having to modify them directly.

The admin provides one feature that application developers often want to modify: managing users via the django.contrib.auth.models.User class. Often, the admin is the only place in which Django users are added or modified, making it difficult to customize this useful class.
Imagine you want the administrator of the site to receive an e-mail every time a new User object is created. Because the User model isn't directly available in the project, it might seem like the only way to accomplish this is to subclass User or use an indirect method such as creating a dummy profile object to modify.

Listing 11 demonstrates how easy it is to add a function that runs when a User instance is saved. Signals are usually added to models.py.

Listing 11. Using Django signals to notify when a new user is added

#!python
	from django.db import models
	from django.db.models import signals
	from django.contrib.auth.models import User
	from django.core.mail import send_mail

	class Document(models.Model):
    	[...]

	class Comment(models.Model):
    	[...]

	def notify_admin(sender, instance, created, **kwargs):
    	'''Notify the administrator that a new user has been added.'''
	    if created:
    	   	subject = 'New user created'
       		message = 'User %s was added' % instance.username
       		from_addr = 'no-reply@example.com'
       		recipient_list = ('admin@example.com',)
       		send_mail(subject, message, from_addr, recipient_list)        

	signals.post_save.connect(notify_admin, sender=User)

---
*[IBM developerWorks](http://goo.gl/mCNs)*

##Adding row-level permissions
A commonly requested feature of the Django admin is that its permission system be extended to include row-level permissions. By default, the admin allows for fine-grained control of roles and rights, but those roles apply only at the class level: a user can either modify all Documents or none.

Often, it is desirable to let users modify only specific objects. These are often called row-level permissions because they reflect the ability to modify only particular rows of a database table rather than blanket permission to modify any record in the table. A use case in the examples application might be that you want users to be able to see only Documents that they created.

First, update models.py to include an attribute recording who created the Document, as shown below.

Listing 12. Updating models.py to record the user who created each Document
#!python
	from django.db import models
	from django.db.models import signals
	from django.contrib.auth.models import User
	from django.core.mail import send_mail
    
	class Document(models.Model):
	    name = models.CharField(max_length=255)
	    text = models.TextField()
	    added_by = models.ForeignKey(User,
			null=True, blank=True)

	    def get_absolute_url(self):
    	    return 'http://example.com/preview/document/%d/' % self.id

	    def __unicode__(self):
    	    return self.name
	[...]
      
``Why blank=True?``
It might not be immediately obvious why a ForeignKey field would be set with blank=True when it isn't a text field. In this case, it's because the Django admin uses blank, rather than null, to determine whether the value must be manually set before saving the model.
If you supply only null=True or neither, then the Django admin forces the user to manually select an "added by" value before saving, when instead you want the behavior to default to the current user on save.

Next, you need to add code to automatically record which user created the Document. Signals don't work for this because the signal doesn't have access to the user object. However, the ModelAdmin class does provide a method that includes the request and, therefore, the current user as a parameter.
Modify the save_model() method in admin.py, as shown below.

Listing 13. Overriding a method in DocumentAdmin to save the current user to the database when created
#!python
	from django.contrib import admin

	class DocumentAdmin(admin.ModelAdmin):
    	def save_model(self, request, obj, form, change):
        	if getattr(obj, 'added_by', None) is None:
            	obj.added_by = request.user
	        obj.last_modified_by = request.user
    	    obj.save()

	[...]
      

If the value of added_by is None, this is a new record that hasn't been saved. (You could also check if change is false, which indicates that the record is being added, but checking for whether added_by is empty means that this also populates records that have been added outside of the admin.)
The next piece of row-level permissions is to restrict the list of documents to only those users who created them. The ModelAdmin class provides a hook for this via a method called queryset(), which determines the default query set returned by any list page.
As shown in Listing 14, override queryset() to restrict the listing to only those Documents created by the current user. Superusers can see all documents.

Listing 14. Overriding the query set returned by the list pages
#!python
	from django.contrib import admin
	from more_with_admin.examples import models

	class DocumentAdmin(admin.ModelAdmin):
   
    	def queryset(self, request):
        	qs = super(DocumentAdmin, self).queryset(request)

	        # If super-user, show all comments
    	    if request.user.is_superuser:
        	    return qs
        
	        return qs.filter(added_by=request.user)
	[...]
      

Now any requests for the Document list page in the admin show only those created by the current user (unless the current user is a superuser, in which case all documents are shown).
Of course, nothing currently prevents a determined user from accessing an edit page for an unauthorized document by knowing its ID. Truly secure row-level permissions require more method overriding. Because admin users are generally trusted to some degree anyway, sometimes basic permissions are enough to provide a streamlined workflow.

---
*[IBM developerWorks](http://goo.gl/mCNs)*
