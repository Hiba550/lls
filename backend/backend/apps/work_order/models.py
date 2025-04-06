from django.db import models

class PCBType(models.Model):
    """Model to define PCB types (YBS, RSM)"""
    code = models.CharField(max_length=10, unique=True)
    name = models.CharField(max_length=50)
    description = models.TextField(blank=True, null=True)
    prefix = models.CharField(max_length=5, help_text="Item code prefix (e.g., 5YB, 5RS)")
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.code})"


class WorkOrder(models.Model):
    product = models.CharField(max_length=300)  # Changed from 50 to 300
    item_code = models.CharField(max_length=50)
    pcb_type = models.ForeignKey(
        PCBType, 
        on_delete=models.SET_NULL,
        null=True, 
        blank=True,
        related_name="work_orders"
    )
    description = models.TextField()
    quantity = models.IntegerField()
    machine_no = models.CharField(max_length=50, blank=True, null=True)
    customer_name = models.CharField(max_length=100, blank=True, null=True)
    target_date = models.DateField()
    released_by = models.CharField(max_length=100)
    remarks = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=[
        ('Pending', 'Pending'),
        ('In Progress', 'In Progress'),
        ('Completed', 'Completed'),
        ('Cancelled', 'Cancelled')
    ], default='Pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.product} - {self.item_code}"

    def save(self, *args, **kwargs):
        """Override save method to automatically set PCB type based on item code prefix"""
        if not self.pcb_type and self.item_code:
            # Try to find a matching PCB type based on the item code prefix
            for pcb_type in PCBType.objects.filter(active=True):
                if self.item_code.startswith(pcb_type.prefix):
                    self.pcb_type = pcb_type
                    break
        
        super().save(*args, **kwargs)