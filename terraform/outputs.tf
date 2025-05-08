output "instance_id" {
  description = "ID of the EC2 instance"
  value       = aws_instance.app_server.id
}

output "instance_public_ip" {
  description = "Public IP address of the EC2 instance"
  value       = aws_instance.app_server.public_ip
}

output "site_monitor_url" {
  description = "URL to access the site monitor application"
  value       = "http://${aws_instance.app_server.public_ip}"
}

output "grafana_url" {
  description = "URL to access the Grafana dashboard"
  value       = "http://${aws_instance.app_server.public_ip}:3000"
}