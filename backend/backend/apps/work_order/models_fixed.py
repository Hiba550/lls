from django.db import models

class PCBType(models.Model):
    """Model to define PCB types (YBS, RSM)"""
    code = models.CharField(max_length=10, unique=True)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    prefix = models.CharField(max_length=10, help_text="Item code prefix (e.g., 5YB, 5RS)")
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
    completed_quantity = models.IntegerField(default=0)  # Track completed units
    machine_no = models.CharField(max_length=50, blank=True, null=True)
    customer_name = models.CharField(max_length=100, blank=True, null=True)
    target_date = models.DateField()
    released_by = models.CharField(max_length=100)
    remarks = models.TextField(blank=True, null=True)
    is_rework = models.BooleanField(default=False)  # Flag for rework orders
    original_work_order = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='rework_orders')
    rework_notes = models.TextField(blank=True, null=True)
    priority = models.CharField(max_length=20, choices=[
        ('low', 'Low'),
        ('normal', 'Normal'),
        ('high', 'High'),
        ('urgent', 'Urgent')
    ], default='normal')
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

    @property
    def remaining_quantity(self):
        """Calculate remaining quantity to be completed"""
        return max(0, self.quantity - self.completed_quantity)
    
    @property
    def completion_percentage(self):
        """Calculate completion percentage"""
        if self.quantity == 0:
            return 0
        return (self.completed_quantity / self.quantity) * 100
    
    @property
    def is_fully_completed(self):
        """Check if all units have been completed"""
        return self.completed_quantity >= self.quantity
    
    def can_complete_unit(self):
        """Check if another unit can be completed"""
        return self.completed_quantity < self.quantity
    
    def complete_unit(self):
        """Mark one unit as completed and update status"""
        if self.can_complete_unit():
            self.completed_quantity += 1
            if self.is_fully_completed:
                self.status = 'Completed'
            elif self.completed_quantity > 0:
                self.status = 'In Progress'
            self.save()
            return True
        return False

    def create_rework_order(self, reason="", components=None, rework_notes=""):
        """Create a rework order based on this work order"""
        rework_order = WorkOrder.objects.create(
            product=f"REWORK - {self.product}",
            item_code=f"RW-{self.item_code}",
            pcb_type=self.pcb_type,
            description=f"Rework for {self.item_code}: {reason}",
            quantity=1,  # Rework orders are typically for 1 unit
            machine_no=self.machine_no,
            customer_name=self.customer_name,
            target_date=self.target_date,
            released_by=f"REWORK_SYSTEM",
            remarks=f"Original WO: {self.item_code}. Reason: {reason}",
            is_rework=True,
            original_work_order=self,
            rework_notes=rework_notes,
            status='Pending'
        )
        return rework_order
    
    @property
    def rework_id(self):
        """Generate a display-friendly rework ID"""
        if self.is_rework:
            return f"RW-{self.id:06d}"
        return None

    def save(self, *args, **kwargs):
        """Override save method to automatically set PCB type based on item code prefix"""
        if not self.pcb_type and self.item_code:
            # Try to find a matching PCB type based on the item code prefix
            for pcb_type in PCBType.objects.filter(active=True):
                if self.item_code.startswith(pcb_type.prefix):
                    self.pcb_type = pcb_type
                    break
        
        super().save(*args, **kwargs)
