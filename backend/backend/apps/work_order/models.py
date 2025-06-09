from django.db import models
import json

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
    
    # Assembly completion tracking fields
    work_order_barcode = models.CharField(max_length=100, blank=True, null=True, help_text="Generated work order barcode")
    assembly_barcode = models.CharField(max_length=100, blank=True, null=True, help_text="Generated assembly barcode/serial number")
    completed_at = models.DateTimeField(null=True, blank=True, help_text="Timestamp when work order was completed")
    completed_by = models.CharField(max_length=100, blank=True, null=True, help_text="User who completed the assembly")
    
    # Component tracking (stored as JSON)
    scanned_components = models.JSONField(default=list, blank=True, help_text="List of scanned component barcodes")
    component_scan_data = models.JSONField(default=dict, blank=True, help_text="Detailed component scan information")
      # Timing and quality data
    assembly_start_time = models.DateTimeField(null=True, blank=True, help_text="When assembly process started")
    assembly_duration_seconds = models.IntegerField(null=True, blank=True, help_text="Total assembly time in seconds")
    quality_notes = models.TextField(blank=True, null=True, help_text="Quality control notes")
    
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
    
    @property
    def display_id(self):
        """Generate a display-friendly ID for work orders"""
        if self.is_rework:
            return f"RW-{self.id:06d}"
        return self.item_code
    
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

    def complete_assembly(self, scanned_components=None, assembly_barcode=None, completed_by=None, start_time=None):
        """Complete an assembly with all tracking data"""
        from django.utils import timezone
        
        completion_time = timezone.now()
        
        # Calculate duration if start time provided
        duration = None
        if start_time and self.assembly_start_time:
            duration = int((completion_time - self.assembly_start_time).total_seconds())
        elif start_time:
            duration = int((completion_time - start_time).total_seconds())
        
        # Update completion fields
        self.completed_at = completion_time
        self.completed_by = completed_by or 'System'
        self.assembly_barcode = assembly_barcode
        self.assembly_duration_seconds = duration
        
        # Store scanned components
        if scanned_components:
            self.scanned_components = scanned_components
            # Create detailed scan data
            self.component_scan_data = {
                'components': scanned_components,
                'scan_count': len(scanned_components),
                'completed_at': completion_time.isoformat(),
                'completed_by': completed_by or 'System'
            }
        
        # Mark as completed
        self.complete_unit()
        
        return True

    def start_assembly(self, started_by=None):
        """Mark assembly as started"""
        from django.utils import timezone
        
        if not self.assembly_start_time:
            self.assembly_start_time = timezone.now()
            if self.status == 'Pending':
                self.status = 'In Progress'
            self.save()
        
        return True

    def add_scanned_component(self, component_barcode, sensor_id=None, scanned_by=None):
        """Add a scanned component to the tracking data"""
        from django.utils import timezone
        
        if not self.scanned_components:
            self.scanned_components = []
        
        component_data = {
            'barcode': component_barcode,
            'scanned_at': timezone.now().isoformat(),
            'scanned_by': scanned_by or 'System'
        }
        
        if sensor_id:
            component_data['sensor_id'] = sensor_id
        
        self.scanned_components.append(component_data)
        
        # Update component scan data
        if not self.component_scan_data:
            self.component_scan_data = {}
        
        self.component_scan_data.update({
            'last_scan': timezone.now().isoformat(),
            'total_scanned': len(self.scanned_components)
        })
        
        self.save()
        return True

    def create_rework_order(self, reason="", components=None, rework_notes=""):
        """Create a rework order based on this work order"""
        rework_order = WorkOrder.objects.create(
            product=f"REWORK - {self.product}",
            item_code=self.item_code,  # Keep original item code for rework
            pcb_type=self.pcb_type,
            description=f"Rework for {self.item_code}: {reason}",
            quantity=1,  # Rework orders are typically for 1 unit
            machine_no=self.machine_no,
            customer_name=self.customer_name,
            target_date=self.target_date,
            released_by="REWORK_SYSTEM",
            remarks=f"Original WO: {self.item_code}. Reason: {reason}",
            is_rework=True,
            original_work_order=self,
            rework_notes=rework_notes,
            status='Pending',
            priority='high'  # Rework orders get high priority
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
