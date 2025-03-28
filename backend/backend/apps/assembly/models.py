from django.db import models
from ..work_order.models import WorkOrder
from ..item_master.models import ItemMaster

class AssemblyProcess(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('rejected', 'Rejected'),
    ]
    
    work_order = models.ForeignKey(WorkOrder, on_delete=models.CASCADE, related_name='assembly_processes_new')
    item = models.ForeignKey(ItemMaster, on_delete=models.CASCADE, related_name='assembly_processes_new', null=True)
    serial_number = models.CharField(max_length=100)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    quantity_completed = models.IntegerField(default=0)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    created_by = models.CharField(max_length=100)
    notes = models.TextField(blank=True, null=True)
    current_sensor_index = models.IntegerField(default=1)  # Track the current sensor being scanned
    
    class Meta:
        verbose_name = "Assembly Process"
        verbose_name_plural = "Assembly Processes"
    
    def __str__(self):
        return f"Assembly {self.serial_number} - {self.work_order.item_code}"

class AssemblyLog(models.Model):
    assembly_process = models.ForeignKey(AssemblyProcess, on_delete=models.CASCADE, related_name='logs')
    timestamp = models.DateTimeField(auto_now_add=True)
    action = models.CharField(max_length=100)
    details = models.TextField()
    operator = models.CharField(max_length=100)
    
    class Meta:
        ordering = ['-timestamp']
    
    def __str__(self):
        return f"{self.action} at {self.timestamp}"

class ScannedPart(models.Model):
    assembly_process = models.ForeignKey(AssemblyProcess, on_delete=models.CASCADE, related_name='scanned_parts')
    part_code = models.CharField(max_length=100)
    sensor_id = models.IntegerField(null=True, blank=True)  # Keep this as nullable
    scan_time = models.DateTimeField(auto_now_add=True)
    operator = models.CharField(max_length=100)
    replaced = models.BooleanField(default=False)
    replaced_with = models.CharField(max_length=100, blank=True, null=True)
    replace_reason = models.TextField(blank=True, null=True)
    replace_time = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        # Use indexes for MySQL since conditional constraints aren't supported
        indexes = [
            models.Index(fields=['assembly_process', 'sensor_id'], name='asm_part_sensor_idx'),
        ]
    
    def __str__(self):
        return f"{self.part_code} for {self.assembly_process.serial_number}"
